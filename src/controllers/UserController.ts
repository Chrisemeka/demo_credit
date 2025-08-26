import { Request, Response } from 'express';
import { WalletModel } from '../models/walletModel';

export class UserController {
    static createWallet = async (req: Request, res: Response) => {
        try {
            const { currency, status} = req.body;
            if (!currency || !status) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            const [wallet_id] = await WalletModel.create({ currency, status });
            return res.status(201).json({message: 'Wallet created successfully', wallet_id});
        } catch (error) {
            throw new Error(`Error cr eating wallet: ${error}`);
        }
    }

    static deleteWallet = async (req: Request, res: Response) => {
        try{
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Unauthorized request' });
            }
            await WalletModel.delete(Number(id));
            return res.status(200).json({message: 'Wallet deleted successfully'});
        } catch (error) {
            throw new Error(`Error deleting wallet: ${error}`);   
        }
    }

    static updateWalletStatus = async (req: Request, res: Response) => {
        try{
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Unauthorized request' });
            }
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            await WalletModel.update(Number(id), { status });
            return res.status(200).json({message: 'Wallet updated successfully'});
        } catch (error) {
            throw new Error(`Error updating wallet: ${error}`);   
        }
    }
}