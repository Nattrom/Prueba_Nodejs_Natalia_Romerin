import { Request, Response } from 'express';
import * as seedService from '../services/seed.service';

interface ServiceError extends Error {
  statusCode?: number;
}

const handleControllerError = (error: unknown, res: Response): void => {
  const serviceError = error as ServiceError;
  const statusCode = serviceError?.statusCode ?? 500;
  const message = serviceError?.message ?? 'An unexpected error occurred';

  res.status(statusCode).json({ message });
};

/**
 * Handle seed file upload.
 */
export const uploadSeedFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify file exists
    if (!req.file) {
      res.status(400).json({ message: 'JSON file is required' });
      return;
    }

    // Process seed file
    const result = await seedService.processSeedFile(req.file.buffer);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
