import { UserRole } from '../models/user.model';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
