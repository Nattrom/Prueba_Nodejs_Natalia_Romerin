import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../models/user.model';
import { config } from '../config/environment';
import { AuthenticatedUser } from '../types';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const parts = authorizationHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    res.status(401).json({ message: 'Malformed Authorization header. Expected: Bearer <token>' });
    return;
  }

  const token = parts[1];

  try {
    const decodedToken = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if (!decodedToken || typeof decodedToken !== 'object') {
      res.status(401).json({ message: 'Invalid token.' });
      return;
    }

    const userId = Number(decodedToken.id);
    const userEmail = typeof decodedToken.email === 'string' ? decodedToken.email : '';
    const userRole = typeof decodedToken.role === 'string' ? decodedToken.role : '';

    if (!userId || !userEmail || !Object.values(UserRole).includes(userRole as UserRole)) {
      res.status(401).json({ message: 'Invalid token payload.' });
      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: userId,
      email: userEmail,
      role: userRole as UserRole,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired.' });
      return;
    }

    res.status(401).json({ message: 'Invalid token.' });
  }
};
