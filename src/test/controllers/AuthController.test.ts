jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    where: jest.fn(),
    first: jest.fn(),
    transaction: jest.fn()
  }
}));

import { Request, Response } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { UserModel } from '../../models/userModel';
import { WalletModel } from '../../models/walletModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import karmaCheckMiddleWare from '../../service/karmaCheckMiddleWare';

jest.mock('../../models/userModel');
jest.mock('../../models/walletModel');
jest.mock('../../service/karmaCheckMiddleWare');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockedUserModel = jest.mocked(UserModel);
const mockedWalletModel = jest.mocked(WalletModel);
const mockedKarmaCheck = jest.mocked(karmaCheckMiddleWare);
const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

describe('AuthController', () => {
    let mockedRequest: Partial<Request>;
    let mockedResponse: Partial<Response>;

    beforeEach(() => {
        mockedRequest = {};
        mockedResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        beforeEach(() => {
            mockedRequest = {
                body: {
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',    
                    phone_number: '1234567890',
                    password: 'password'
                }
            };
        });
        
        describe('positive scenarios', () => {
            it('should successfully register a new user', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);
                mockedKarmaCheck.mockResolvedValue({
                    isBlacklisted: false,
                    reason: 'CLEAN',
                    amountInContention: 0,
                    threshold: 5000,
                    rawResponse: {} as any
                });
                (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
                mockedUserModel.create.mockResolvedValue([1]);
                mockedWalletModel.create.mockResolvedValue([1]);

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(201);
                expect(mockedResponse.json).toHaveBeenCalledWith({message: 'User created successfully', user_id: 1});
            });

            it('should hash password before storing', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);
                mockedKarmaCheck.mockResolvedValue({
                    isBlacklisted: false,
                    reason: 'CLEAN',
                    amountInContention: 0,
                    threshold: 5000,
                    rawResponse: {} as any
                });
                (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
                mockedUserModel.create.mockResolvedValue([1]);
                mockedWalletModel.create.mockResolvedValue([1]);

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedBcrypt.hash).toHaveBeenCalledWith('password', 10);
                expect(mockedUserModel.create).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',    
                    phone_number: '1234567890',
                    password: 'hashedPassword'
                });
            });

            it('should create a wallet after successful user creation', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);
                mockedKarmaCheck.mockResolvedValue({
                    isBlacklisted: false,
                    reason: 'CLEAN',
                    amountInContention: 0,
                    threshold: 5000,
                    rawResponse: {} as any
                });
                (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
                mockedUserModel.create.mockResolvedValue([1]);
                mockedWalletModel.create.mockResolvedValue([1]);

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedWalletModel.create).toHaveBeenCalledWith({
                    user_id: 1,
                    account_number: expect.any(Number),
                    currency: 'NGN',
                    status: 'active'
                });
            });
        });

        describe('negative scenarios', () => {
            it('should return 400 if required fields are missing', async () => {
                mockedRequest.body = {
                    email: 'test@example.com'
                }

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(400);
                expect(mockedResponse.json).toHaveBeenCalledWith({message: 'All fields are required'});
            })

            it('should return 400 if user already exists', async () => {
                mockedUserModel.findByEmail.mockResolvedValue({
                    id: 1,
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',    
                    phone_number: '1234567890',
                    password: 'password'
                });

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(400);
                expect(mockedResponse.json).toHaveBeenCalledWith({message: 'User already exists'});
            });

            it('should return 400 if user is blacklisted', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);
                mockedKarmaCheck.mockResolvedValue({
                    isBlacklisted: true,
                    reason: 'AMOUNT_EXCEEDED',
                    amountInContention: 10000,
                    threshold: 5000,
                    rawResponse: {} as any
                });

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(400);
                expect(mockedResponse.json).toHaveBeenCalledWith({
                    message: 'Registration not allowed due to karma check failure'
                });
            });

            it('should handle karma check API failure gracefully', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);
                mockedKarmaCheck.mockResolvedValue({
                    isBlacklisted: false,
                    reason: 'API_FAILED',
                    message: 'API call failed',
                    rawResponse: {} as any
                });
                (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
                mockedUserModel.create.mockResolvedValue([1]);
                mockedWalletModel.create.mockResolvedValue([1]);

                await AuthController.register(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(201);
                expect(mockedResponse.json).toHaveBeenCalledWith({message: 'User created successfully', user_id: 1});
            });
        })
    });

    describe('login', () => {
        beforeEach(() => {
            mockedRequest = {
                body: {
                    email: 'test@example.com',
                    password: 'password'
                }
            };
        })

        describe('positive scenarios', () => {
            it('should return 200 if login is successful', async () => {
                const mockUser = {
                    id: 1,
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',    
                    phone_number: '1234567890',
                    password: 'hashedpassword'
                }

                mockedUserModel.findByEmail.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
                (mockedJwt.sign as jest.Mock).mockReturnValue('jwt-token');
                mockedUserModel.update.mockResolvedValue(1);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(200);
                expect(mockedResponse.json).toHaveBeenCalledWith({message: 'Login successful', token: 'jwt-token'});
            });

            it('should generate JWT token with correct payload', async () => {
                const mockUser = {
                    id: 1,
                    email: 'test@example.com',
                    first_name: 'John',
                    last_name: 'Doe',    
                    phone_number: '1234567890',
                    password: 'hashedpassword'
                }

                mockedUserModel.findByEmail.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
                (mockedJwt.sign as jest.Mock).mockReturnValue('jwt-token');
                mockedUserModel.update.mockResolvedValue(1);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedJwt.sign).toHaveBeenCalledWith({user_id: 1}, process.env.JWT_SECRET, {expiresIn: '1h'});
            })

            it('should update user with auth token and expiration', async () => {

                const mockUser = {
                id: 1,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '1234567890',
                password: 'hashedPassword'
                };

                mockedUserModel.findByEmail.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
                (mockedJwt.sign as jest.Mock).mockReturnValue('jwt-token');
                mockedUserModel.update.mockResolvedValue(1);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedUserModel.update).toHaveBeenCalledWith(1, {
                auth_token: 'jwt-token',
                token_expiration: expect.any(Date)
                });
            });
        });

        describe('negative scenarios', () => {
            it('should return 401 if email is incorrect', async () => {
                mockedUserModel.findByEmail.mockResolvedValue(undefined);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(401);
                expect(mockedResponse.json).toHaveBeenCalledWith({
                message: 'Invalid email or password'
                });
            });

            it('should return 401 if password is incorrect', async () =>{
                const mockUser = {
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '1234567890',
                password: 'hashedPassword'
                };

                mockedUserModel.findByEmail.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(401);
                expect(mockedResponse.json).toHaveBeenCalledWith({
                message: 'Invalid email or password'
                });
            });

            it('should return 500 if token update fails', async () => {
                const mockUser = {
                id: 1,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                phone_number: '1234567890',
                password: 'hashedPassword'
                };

                mockedUserModel.findByEmail.mockResolvedValue(mockUser);
                (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
                (mockedJwt.sign as jest.Mock).mockReturnValue('jwt-token');
                mockedUserModel.update.mockResolvedValue(0);

                await AuthController.login(mockedRequest as Request, mockedResponse as Response);

                expect(mockedResponse.status).toHaveBeenCalledWith(500);
                expect(mockedResponse.json).toHaveBeenCalledWith({
                message: 'Error logging in'
                });
      });
        })
    });
})