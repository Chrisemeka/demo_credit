import { WalletController } from "../controllers/WalletController";
import { TransactionController } from "../controllers/TransactionController";
import { Router } from "express";
import { authMiddleWare } from "../service/authMiddleware"; 

const router = Router();

router.post('/create-wallet', authMiddleWare, WalletController.createWallet);
router.post('/delete-wallet/:id', authMiddleWare, WalletController.deleteWallet);
router.patch('/update-wallet-status/:id', authMiddleWare, WalletController.updateWalletStatus);
router.get('/get-balance/:id', authMiddleWare, TransactionController.getBalance);

export default router