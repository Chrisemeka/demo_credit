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
import { WalletController } from '../../controllers/WalletController';
import { WalletModel } from '../../models/walletModel';
import { UserModel } from '../../models/userModel';

jest.mock('../../models/walletModel');
jest.mock('../../models/userModel');

const mockedWalletModel = jest.mocked(WalletModel);
const mockedUserModel = jest.mocked(UserModel);

interface AuthRequest extends Request {
  user?: { user_id: number };
}

describe('WalletController', () => {
  let mockedRequest: Partial<AuthRequest>;
  let mockedResponse: Partial<Response>;

  beforeEach(() => {
    mockedRequest = {
      user: { user_id: 1 }
    };
    mockedResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('generateAccountNumber', () => {
    it('should generate account number', () => {
        const accountNumber = WalletController.generateAccountNumber();
        
        const accountStr = accountNumber.toString();
        expect(accountStr).toMatch(/^\d{8}$/); 
        expect(accountStr.length).toBe(8); 
    });

    it('should always generate 8-digit numbers', () => {
    for (let i = 0; i < 5; i++) {
        const accountNumber = WalletController.generateAccountNumber();
        expect(accountNumber.toString()).toMatch(/^\d{8}$/);
        expect(accountNumber.toString().length).toBe(8);
    }
    });
  });

  describe('createWallet', () => {
    beforeEach(() => {
      mockedRequest.body = {
        currency: 'NGN',
        status: 'active'
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully create a wallet', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '1234567890',
          password: 'hashedPassword'
        };

        mockedUserModel.findById.mockResolvedValue(mockUser);
        mockedWalletModel.create.mockResolvedValue([5]);

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(201);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet created successfully',
          wallet_id: 5
        });
      });

      it('should create wallet with generated account number and default balance', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '1234567890',
          password: 'hashedPassword'
        };

        mockedUserModel.findById.mockResolvedValue(mockUser);
        mockedWalletModel.create.mockResolvedValue([5]);

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedWalletModel.create).toHaveBeenCalledWith({
          user_id: 1,
          account_number: expect.any(Number),
          currency: 'NGN',
          status: 'active',
          balance: 0.00
        });
      });

      it('should create wallet with different currencies', async () => {
        mockedRequest.body.currency = 'USD';
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '1234567890',
          password: 'hashedPassword'
        };

        mockedUserModel.findById.mockResolvedValue(mockUser);
        mockedWalletModel.create.mockResolvedValue([5]);

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedWalletModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: 'USD'
          })
        );
      });

      it('should create wallet with different status values', async () => {
        mockedRequest.body.status = 'frozen';
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '1234567890',
          password: 'hashedPassword'
        };

        mockedUserModel.findById.mockResolvedValue(mockUser);
        mockedWalletModel.create.mockResolvedValue([5]);

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedWalletModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'frozen'
          })
        );
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if required fields are missing', async () => {
        mockedRequest.body = { currency: 'NGN' }; 

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'All fields are required'
        });
      });

      it('should return 400 if currency is missing', async () => {
        mockedRequest.body = { status: 'active' }; 

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'All fields are required'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });

      it('should return 404 if user is not found', async () => {
        mockedUserModel.findById.mockResolvedValue(undefined);

        await WalletController.createWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(404);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'User not found'
        });
      });
    });
  });

  describe('deleteWallet', () => {
    beforeEach(() => {
      mockedRequest.params = { id: '1' };
    });

    describe('Positive Scenarios', () => {
      it('should successfully delete own wallet', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);
        mockedWalletModel.delete.mockResolvedValue(1);

        await WalletController.deleteWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet deleted successfully'
        });
        expect(mockedWalletModel.delete).toHaveBeenCalledWith(1);
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if wallet ID is missing', async () => {
        mockedRequest.params = {};

        await WalletController.deleteWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet ID is required'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await WalletController.deleteWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });

      it('should return 404 if wallet is not found', async () => {
        mockedWalletModel.findById.mockResolvedValue(undefined);

        await WalletController.deleteWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(404);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet not found'
        });
      });

      it('should return 403 if trying to delete another users wallet', async () => {
        const mockWallet = {
          id: 1,
          user_id: 2, 
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await WalletController.deleteWallet(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(403);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Forbidden: You can only delete your own wallet'
        });
      });
    });
  });

  describe('updateWalletStatus', () => {
    beforeEach(() => {
      mockedRequest = {
        user: { user_id: 1 },
        params: { id: '1' },
        body: { status: 'frozen' }
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully update wallet status', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);
        mockedWalletModel.update.mockResolvedValue(1);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet updated successfully'
        });
        expect(mockedWalletModel.update).toHaveBeenCalledWith(1, { status: 'frozen' });
      });

      it('should handle different status values', async () => {
        mockedRequest.body.status = 'closed';
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);
        mockedWalletModel.update.mockResolvedValue(1);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedWalletModel.update).toHaveBeenCalledWith(1, { status: 'closed' });
      });

      it('should update status from any current status', async () => {
        mockedRequest.body.status = 'active';
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'frozen' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);
        mockedWalletModel.update.mockResolvedValue(1);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedWalletModel.update).toHaveBeenCalledWith(1, { status: 'active' });
        expect(mockedResponse.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if wallet ID is missing', async () => {
        mockedRequest.params = {};

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet Id is required'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });

      it('should return 404 if wallet is not found', async () => {
        mockedWalletModel.findById.mockResolvedValue(undefined);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(404);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet not found'
        });
      });

      it('should return 403 if trying to update another users wallet', async () => {
        const mockWallet = {
          id: 1,
          user_id: 2, 
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(403);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Forbidden: You can only update your own wallet'
        });
      });

      it('should return 400 if status is missing', async () => {
        mockedRequest.body = {}; 
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'All fields are required'
        });
      });

      it('should handle database update errors', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);
        mockedWalletModel.update.mockRejectedValue(new Error('Database update failed'));

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(500);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Error updating wallet',
          error: expect.any(Error)
        });
      });

      it('should handle empty status string', async () => {
        mockedRequest.body = { status: '' }; 
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await WalletController.updateWalletStatus(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'All fields are required'
        });
      });
    });
  });
});