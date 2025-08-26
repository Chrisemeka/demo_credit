import { UserController } from "../controllers/UserController";
import { WalletController } from "../controllers/WalletController";
import { Router } from "express";
import { authMiddleWare } from "../service/authMiddleware"; 

const router = Router();

router.post('/create-wallet', authMiddleWare, UserController.createWallet);
router.post('/delete-wallet/:id', authMiddleWare, UserController.deleteWallet);
router.post('/update-wallet-status/:id', authMiddleWare, UserController.updateWalletStatus);
router.get('/get-balance/:account_number', authMiddleWare, WalletController.getBalance);
router.get('/get-transaction-history', authMiddleWare, WalletController.getTransactionHistory);

export default router