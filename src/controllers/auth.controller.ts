import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthError } from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    const authError = error as AuthError;
    const statusCode = authError.statusCode ?? 500;
    const message = authError.message ?? 'Registration failed.';

    res.status(statusCode).json({
      message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);

    res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    const authError = error as AuthError;
    const statusCode = authError.statusCode ?? 500;
    const message = authError.message ?? 'Login failed.';

    res.status(statusCode).json({
      message,
    });
  }
};
