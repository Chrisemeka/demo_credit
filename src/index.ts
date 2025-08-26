import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transaction';
import walletRoutes from './routes/wallet';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transaction', transactionRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.listen(port, () => {
    console.log(`The Server is running on port http://localhost:${process.env.PORT}`);
});