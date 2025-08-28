import { Request, Response } from 'express';
import { WalletModel } from '../models/walletModel';
import { UserModel } from '../models/userModel';

interface AuthRequest extends Request {
    user?: { user_id: number};
}

export class WalletController {
     static generateAccountNumber = (): number => {
        const prefix = '001';
        const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
        
        return parseInt(`${prefix}${randomSuffix}`);
    };
    static createWallet = async (req: AuthRequest, res: Response) => {
        try {
            const { currency, status} = req.body;
            if (!currency || !status) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            const user_id = req.user?.user_id;
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const user = await UserModel.findById(user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const accountNumber = this.generateAccountNumber();
            const [wallet_id] = await WalletModel.create({ user_id, account_number: accountNumber, currency, status, balance: 0.00 });
            return res.status(201).json({message: 'Wallet created successfully', wallet_id});
        } catch (error) {
            return res.status(500).json({ message: 'Error creating wallet', error: error });  
        }
    }

    static deleteWallet = async (req: AuthRequest, res: Response) => {
        try{
            const { id } = req.params;
            const user_id = req.user?.user_id;
            if (!id) {
                return res.status(400).json({ message: 'Wallet ID is required' });
            }
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const wallet = await WalletModel.findById(Number(id));
            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found' });
            }
            if (wallet.user_id !== user_id) {
                return res.status(403).json({ 
                    message: 'Forbidden: You can only delete your own wallet' 
                });
            }
            await WalletModel.delete(Number(id));
            return res.status(200).json({message: 'Wallet deleted successfully'});
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting wallet', error: error });  
        }
    }

    static updateWalletStatus = async (req: AuthRequest, res: Response) => {
        try{
            const { id } = req.params;
            const user_id = req.user?.user_id;
            if (!id) {
                return res.status(400).json({ message: 'Wallet Id is required' });
            }
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const wallet = await WalletModel.findById(Number(id));
            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found' });
            }
            if (wallet.user_id !== user_id) {
                return res.status(403).json({ 
                    message: 'Forbidden: You can only update your own wallet' 
                });
            }
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            await WalletModel.update(Number(id), { status });
            return res.status(200).json({message: 'Wallet updated successfully'});
        } catch (error) {
            return res.status(500).json({ message: 'Error updating wallet', error: error });  
   
        }
    }
}