import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import { UserController } from './UserController'; 
import { WalletModel } from '../models/walletModel'; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import karmaCheckMiddleWare from '../service/karmaCheckMiddleWare';


export class AuthController {
    static register = async (req: Request, res: Response) => {
        try {
                const { email, first_name, last_name, phone_number, password } = req.body;
                if (!email || !first_name || !last_name || !phone_number || !password) {
                    return res.status(400).json({ message: 'All fields are required' });
                }
                const existingUser = await UserModel.findByEmail(email);
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' });
                }
                const isBlacklisted = await karmaCheckMiddleWare(email);
                if (isBlacklisted) {
                    return res.status(403).json({
                    error: 'User verification failed. Account cannot be created.',
                    code: 'KARMA_BLACKLISTED'
                    });
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                const [user_id] = await UserModel.create({
                    email,
                    first_name,
                    last_name,
                    phone_number,
                    password: hashedPassword,
                });
                await WalletModel.create({ user_id, account_number: UserController.generateAccountNumber(), currency: 'NGN', status: 'active' });

                return res.status(201).json({message: 'User created successfully', user_id});
        } catch (error) {
            return res.status(501).json({message: 'Error creating user', error});
        }
    }

    static login = async (req: Request, res: Response) => {
        try {
                const { email, password } = req.body;
                const user = await UserModel.findByEmail(email);
                if (!user) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }
                if (!(await bcrypt.compare(password, user.password))) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }
                const user_id = user.id;
                if (!user_id) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }
                const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                const updatedUser = await UserModel.update(user_id, { auth_token: token, token_expiration: new Date(Date.now() + 3600000) });
                if (!updatedUser) {
                    return res.status(500).json({ message: 'Error logging in' });
                }
                return res.status(200).json({ message: 'Login successful', token });
        } catch (error) {
            return res.status(501).json({message: 'Error creating user', error});
        }
    }
}