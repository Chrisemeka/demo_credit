import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: { userId: number};
}

export const authMiddleWare = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({error: 'No token provided'});
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {userId: number}
        req.user = {userId: decoded.userId}
        next();
    } catch (error) {
        res.status(401).json({error: 'Invalid token'});
        return
    }
}