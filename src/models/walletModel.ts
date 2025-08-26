import db from '../config/database';

export interface Wallet {
    id?: number;
    user_id?: number;
    account_number?: number;
    balance?: number;
    currency?: string;
    status?: "active" | "frozen" | "closed";
    created_at?: Date;
    updated_at?: Date;
}

export class WalletModel {
    static async create(wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<number[]> {
        return db('wallets').insert(wallet);
    }

    static async update(account_number: number, updates: Partial<Wallet>): Promise<number> {
        return db('wallets').where({ account_number }).update(updates);
    }

    static async delete(id: number): Promise<number> {
        return db('wallets').where({ id }).delete();
    }

    static async findByAccountNumber(account_number: number): Promise<Wallet | undefined> {
        return db('wallets').where({ account_number }).first();
    }
}