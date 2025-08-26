import { TransactionController } from "../controllers/TransactionController";
import { Router } from "express";
import { authMiddleWare } from "../service/authMiddleware"; 

const router = Router();

router.post('/deposit', authMiddleWare, TransactionController.deposit);
router.post('/withdraw', authMiddleWare, TransactionController.withdraw);
router.post('/transfer', authMiddleWare, TransactionController.transfer);

export default router