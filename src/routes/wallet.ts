import { WalletController } from "../controllers/WalletController";
import { Router } from "express";
import { authMiddleWare } from "../service/authMiddleware"; 

const router = Router();

router.post('/deposit', authMiddleWare, WalletController.deposit);
router.post('/withdraw', authMiddleWare, WalletController.withdraw);
router.post('/transfer', authMiddleWare, WalletController.transfer);

export default router