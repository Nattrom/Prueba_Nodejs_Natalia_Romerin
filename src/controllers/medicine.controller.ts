import { Request, Response } from 'express';
import * as medicineService from '../services/medicine.service';

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
 * Create a medicine from the request payload.
 * @param req Express request containing medicine data in the body.
 * @param res Express response used to return the created medicine.
 * @returns A promise that resolves after the response is sent.
 */
export const createMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicine = await medicineService.createMedicine(req.body);
    res.status(201).json({ message: 'Medicine created successfully', data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return all active medicines.
 * @param _req Express request, unused by this collection endpoint.
 * @param res Express response used to return the medicines.
 * @returns A promise that resolves after the response is sent.
 */
export const listMedicines = async (_req: Request, res: Response): Promise<void> => {
  try {
    const medicines = await medicineService.listMedicines();
    res.status(200).json({ data: medicines });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return a medicine identified by its route parameter.
 * @param req Express request containing the medicine ID in `params.id`.
 * @param res Express response used to return the medicine.
 * @returns A promise that resolves after the response is sent.
 */
export const getMedicineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const medicine = await medicineService.getMedicineById(medicineId);
    res.status(200).json({ data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Update an existing medicine.
 * @param req Express request containing the medicine ID and update body.
 * @param res Express response used to return the updated medicine.
 * @returns A promise that resolves after the response is sent.
 */
export const updateMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const medicine = await medicineService.updateMedicine(medicineId, req.body);
    res.status(200).json({ message: 'Medicine updated successfully', data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Soft-delete a medicine.
 * @param req Express request containing the medicine ID in `params.id`.
 * @param res Express response used to return the operation result.
 * @returns A promise that resolves after the response is sent.
 */
export const deleteMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const result = await medicineService.deleteMedicine(medicineId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
