import { Request, Response } from 'express';
import { WalletModel, Wallet } from '../models/walletModel';
import db from '../config/database';

interface AuthRequest extends Request {
    user?: { user_id: number};
}

export class TransactionController {
    private static async validateAccount(account_number: number): Promise<Wallet> {
        const wallet = await WalletModel.findByAccountNumber(account_number);
        if (!wallet) {
            throw new Error('Account not found');
        }
        if (wallet.status !== 'active') {
            throw new Error('Account is not active');
        }
        return wallet;
    }
    private static validateBalance(senderBalance: number, amount: number): void {
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }
        if (senderBalance < amount) {
            throw new Error('Insufficient balance');
        }
    }
    static async deposit(req: AuthRequest, res: Response) {
        const trx = await db.transaction();       
        try {
            const { account_number, amount } = req.body;
            if (!account_number || !amount) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const user_id = req.user?.user_id;
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
           const depositAmount = parseFloat(String(amount));
            if (isNaN(depositAmount) || depositAmount <= 0) {
                throw new Error('Amount must be a valid number greater than zero');
            }
            const wallet = await TransactionController.validateAccount(account_number);
            const currentBalance = Number(wallet.balance) || 0;
            const newBalance = currentBalance + depositAmount;
            const roundedBalance = Math.round(newBalance * 100) / 100;
            await trx('wallets').where({ account_number }).update({ balance: roundedBalance });
            await trx.commit();
            res.status(200).json({
                message: 'Deposit successful',
                new_balance: roundedBalance.toFixed(2),
            });

        } catch (error) {
            await trx.rollback();
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Deposit failed'

            });
        }
    }

/*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Withdraw an amount from the user's wallet
     * @param req - The request object
     * @param res - The response object
     * @throws {Error} - If the user doesn't have enough balance
     * @throws {Error} - If the user is not authenticated
     */

/*******  4073f051-f0a8-47ae-9a3b-b8833a152cc1  *******/
    static async withdraw(req: AuthRequest, res: Response) {  
        const trx = await db.transaction();      
        try {
            const { account_number, amount} = req.body;
            if (!account_number || !amount) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const user_id = req.user?.user_id;
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const wallet = await TransactionController.validateAccount(account_number);
            if (amount > wallet.balance!) {
                throw new Error('Insufficient balance');
            }
            const newBalance = wallet.balance! - amount;
            await trx('wallets').where({ account_number }).update({ balance: newBalance });
            await trx.commit();
            res.status(200).json({
                message: 'Withdrawal successful',
                new_balance: newBalance,
            });

        } catch (error) { 
            await trx.rollback();           
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Withdrawal failed'
                
            });
        }
    }

    static async transfer(req: AuthRequest, res: Response) { 
        const trx = await db.transaction();       
        try {
            const { sender_account, receiver_account, amount } = req.body;
            if (!sender_account || !receiver_account || !amount) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            if (sender_account === receiver_account) {
                throw new Error('Cannot transfer to the same account');
            }
            const senderWallet = await TransactionController.validateAccount(sender_account);
            const receiverWallet = await TransactionController.validateAccount(receiver_account);
            if (!senderWallet) {
                throw new Error('Sender account not found');
            }
            if (!receiverWallet) {
                throw new Error('Receiver account not found');
            }
            if (senderWallet.status !== 'active') {
                throw new Error('Sender account is not active');
            }
            if (receiverWallet.status !== 'active') {
                throw new Error('Receiver account is not active');
            }
            TransactionController.validateBalance(senderWallet.balance!, amount);
            const newSenderBalance = senderWallet.balance! - amount;
            await trx('wallets').where({ account_number: sender_account }).update({ balance: newSenderBalance });
            const newReceiverBalance = receiverWallet.balance! + amount;
            await trx('wallets').where({ account_number: receiver_account }).update({ balance: newReceiverBalance });
            await trx.commit();
            res.status(200).json({
                message: 'Transfer successful',
                sender_new_balance: newSenderBalance,
                receiver_new_balance: newReceiverBalance
            });

        } catch (error) {   
            await trx.rollback();         
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Transfer failed'
            });
        }
    }

    static async getBalance(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const user_id = req.user?.user_id;
            if (!id) {
                res.status(400).json({ error: 'Wallet ID is required' });
                return;
            }
            if (!user_id) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const wallet = await WalletModel.findById(Number(id));
            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found' });
            } if (wallet.status !== "active") {
                return res.status(403).json({ message: 'Forbidden: Wallet is not active' });
            }
            if (wallet.user_id !== user_id) {
                return res.status(403).json({ 
                    message: 'Forbidden: You can only get the balance of your own wallet' 
                });
            }
            res.status(200).json({
                account_number: wallet.account_number,
                balance: wallet.balance,
                currency: wallet.currency,
                status: wallet.status
            });

        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to get balance'
            });
        }
    }
}