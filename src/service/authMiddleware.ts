import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: { user_id: number};
}

export const authMiddleWare = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({error: 'No token provided'});
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {user_id: number}
        req.user = {user_id: decoded.user_id}
        next();
    } catch (error) {
        res.status(401).json({error: 'Invalid token'});
        return
    }
}