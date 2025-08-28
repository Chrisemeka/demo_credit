import type { Knex } from "knex";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lendsqr_wallet_dev'
    },
    migrations: {
      directory: './knexMigrations', 
      extension: 'ts',
      tableName: 'knex_migrations'
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false 
      }
    },
    migrations: {
      directory: './knexMigrations', 
      extension: 'js',
      tableName: 'knex_migrations'
    },
  }
};

export default config;