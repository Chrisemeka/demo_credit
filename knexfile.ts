import type { Knex } from "knex";
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql",
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lendsqr_wallet_dev'
    },
    migrations: {
      directory: './src/knexMigrations',
      extension: 'ts',
      tableName: 'knex_migrations'
    },
  },

  production: {
    client: "mysql",
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
      directory: './src/knexMigrations',
      extension: 'js',
      tableName: 'knex_migrations'
    },
  }

};

export default config;
