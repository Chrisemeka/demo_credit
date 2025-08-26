import db from '../config/database';

export interface Transaction {
  id?: number;
  sender_id?: number;
  receiver_id: number;
  transaction_type: "credit" | "debit";
  amount: number;
  description?: string;
  status?: "pending" | "completed" | "failed";
  created_at?: Date;
}

export class TransactionModel {
  static async create(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<number[]> {
    return db('transactions').insert(transaction);
  }

  static async findAll(): Promise<Transaction[]> {
    return db('transactions').select('*');
  }

  static async findById(id: number): Promise<Transaction | undefined> {
    return db('transactions').where({ id }).first();
  }

  static async findByDate(date: Date): Promise<Transaction[]> {
    return db('transactions').where({ created_at: date }).select('*');
  }

  static async update(id: number, updates: Partial<Transaction>): Promise<number> {
    return db('transactions').where({ id }).update(updates);
  }
}