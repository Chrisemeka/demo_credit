import db from '../config/database';

export interface User {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_verified?: boolean;
  password: string;
  auth_token?: string;
  token_expiration?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db('users').insert(user);
  }

  static async findById(id: number): Promise<User | undefined> {
    return db('users').where({ id }).first();
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    return db('users').where({ email }).first();
  }

  static async update(id: number, updates: Partial<User>): Promise<number> {
    return db('users').where({ id }).update(updates);
  }
}