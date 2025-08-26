import { Request, Response } from 'express';
import { TransactionModel, Transaction } from '../models/transactionModel';
import { WalletModel, Wallet } from '../models/walletModel';

export class WalletController {
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
    private static async recordTransaction(transactionData: Omit<Transaction, 'id' | 'created_at'>): Promise<number> {
        const [transactionId] = await TransactionModel.create(transactionData);
        return transactionId;
    }

    static async deposit(req: Request, res: Response): Promise<void> {        
        try {
            const { account_number, amount, description, user_id } = req.body;

            if (!account_number || !amount || !user_id) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const wallet = await WalletController.validateAccount(account_number);

            if (amount <= 0) {
                throw new Error('Amount must be greater than zero');
            }

            const transactionId = await WalletController.recordTransaction({
                receiver_id: user_id,
                transaction_type: 'credit',
                amount,
                description: description || 'Wallet deposit',
                status: 'pending'
            });

            const newBalance = wallet.balance! + amount;
            await WalletModel.update(account_number, { balance: newBalance });

            await TransactionModel.update(transactionId, { status: 'completed' });

            res.status(200).json({
                message: 'Deposit successful',
                transaction_id: transactionId,
                new_balance: newBalance,
            });

        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Deposit failed'
            });
        }
    }

    static async withdraw(req: Request, res: Response): Promise<void> {        
        try {
            const { account_number, amount, description, user_id } = req.body;

            if (!account_number || !amount || !user_id) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            const wallet = await WalletController.validateAccount(account_number);

            WalletController.validateBalance(wallet.balance!, amount);

            const transactionId = await WalletController.recordTransaction({
                sender_id: user_id,
                receiver_id: user_id,
                transaction_type: 'debit',
                amount,
                description: description || 'Wallet withdrawal',
                status: 'pending'
            });

            const newBalance = wallet.balance! - amount;
            await WalletModel.update(account_number, { balance: newBalance });

            await TransactionModel.update(transactionId, { status: 'completed' });

            res.status(200).json({
                message: 'Withdrawal successful',
                transaction_id: transactionId,
                new_balance: newBalance,
            });

        } catch (error) {            
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Withdrawal failed'
            });
        }
    }

    static async transfer(req: Request, res: Response): Promise<void> {        
        try {
            const { sender_account, receiver_account, amount, description, sender_user_id,receiver_user_id } = req.body;

            if (!sender_account || !receiver_account || !amount || !sender_user_id) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            if (sender_account === receiver_account) {
                throw new Error('Cannot transfer to the same account');
            }

            const senderWallet = await WalletController.validateAccount(sender_account);
            const receiverWallet = await WalletController.validateAccount(receiver_account);

            WalletController.validateBalance(senderWallet.balance!, amount);

            const debitTransactionId = await WalletController.recordTransaction({
                sender_id: sender_user_id,
                receiver_id: receiver_user_id || sender_user_id,
                transaction_type: 'debit',
                amount,
                description: description || `Transfer to ${receiver_account}`,
                status: 'pending'
            });

            const creditTransactionId = await WalletController.recordTransaction({
                sender_id: sender_user_id,
                receiver_id: receiver_user_id || sender_user_id,
                transaction_type: 'credit',
                amount,
                description: description || `Transfer from ${sender_account}`,
                status: 'pending'
            });

            const newSenderBalance = senderWallet.balance! - amount;
            await WalletModel.update(sender_account, { balance: newSenderBalance });

            const newReceiverBalance = receiverWallet.balance! + amount;
            await WalletModel.update(receiver_account, { balance: newReceiverBalance });

            await TransactionModel.update(debitTransactionId, { status: 'completed' });
            await TransactionModel.update(creditTransactionId, { status: 'completed' });

            res.status(200).json({
                message: 'Transfer successful',
                sender_transaction_id: debitTransactionId,
                receiver_transaction_id: creditTransactionId,
                sender_new_balance: newSenderBalance,
                receiver_new_balance: newReceiverBalance
            });

        } catch (error) {            
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Transfer failed'
            });
        }
    }

    static async getBalance(req: Request, res: Response): Promise<void> {
        try {
            const { account_number } = req.params;

            if (!account_number) {
                res.status(400).json({ error: 'Account number is required' });
                return;
            }

            const wallet = await WalletController.validateAccount(parseInt(account_number));

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

    static async getTransactionHistory(req: Request, res: Response): Promise<void> {
        try {
            const { user_id } = req.params;
            
            if (!user_id) {
                res.status(400).json({ error: 'User ID is required' });
                return;
            }

            const transactions = await TransactionModel.findAll()

            res.status(200).json({
                transactions,
                count: transactions.length
            });

        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch transaction history'
            });
        }
    }
}