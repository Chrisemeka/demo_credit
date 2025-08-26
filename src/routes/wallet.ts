import { UserController } from "../controllers/WalletController";
import { TransactionController } from "../controllers/TransactionController";
import { Router } from "express";
import { authMiddleWare } from "../service/authMiddleware"; 

const router = Router();

router.post('/create-wallet', authMiddleWare, UserController.createWallet);
router.post('/delete-wallet/:id', authMiddleWare, UserController.deleteWallet);
router.post('/update-wallet-status/:id', authMiddleWare, UserController.updateWalletStatus);
router.get('/get-balance/:id', authMiddleWare, TransactionController.getBalance);

export default router