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

export const createMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicine = await medicineService.createMedicine(req.body);
    res.status(201).json({ message: 'Medicine created successfully', data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const listMedicines = async (_req: Request, res: Response): Promise<void> => {
  try {
    const medicines = await medicineService.listMedicines();
    res.status(200).json({ data: medicines });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getMedicineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const medicine = await medicineService.getMedicineById(medicineId);
    res.status(200).json({ data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const medicine = await medicineService.updateMedicine(medicineId, req.body);
    res.status(200).json({ message: 'Medicine updated successfully', data: medicine });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const deleteMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicineId = Number(req.params.id);
    const result = await medicineService.deleteMedicine(medicineId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
