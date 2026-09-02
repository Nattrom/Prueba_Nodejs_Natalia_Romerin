import { Request, Response } from 'express';
import * as warehouseMedicineService from '../services/warehouseMedicine.service';

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
 * Create an inventory record for a warehouse and medicine.
 * @param req Express request containing inventory data in the body.
 * @param res Express response used to return the created record.
 * @returns A promise that resolves after the response is sent.
 */
export const createWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await warehouseMedicineService.createWarehouseMedicine(req.body);
    res.status(201).json({ message: 'Warehouse medicine created successfully', data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return all active warehouse-medicine inventory records.
 * @param _req Express request, unused by this collection endpoint.
 * @param res Express response used to return the inventory records.
 * @returns A promise that resolves after the response is sent.
 */
export const listWarehouseMedicines = async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await warehouseMedicineService.listWarehouseMedicines();
    res.status(200).json({ data: records });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return an inventory record identified by its route parameter.
 * @param req Express request containing the record ID in `params.id`.
 * @param res Express response used to return the inventory record.
 * @returns A promise that resolves after the response is sent.
 */
export const getWarehouseMedicineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const record = await warehouseMedicineService.getWarehouseMedicineById(warehouseMedicineId);
    res.status(200).json({ data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Update the stock or associations of an inventory record.
 * @param req Express request containing the record ID and update body.
 * @param res Express response used to return the updated record.
 * @returns A promise that resolves after the response is sent.
 */
export const updateWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const record = await warehouseMedicineService.updateWarehouseMedicine(warehouseMedicineId, req.body);
    res.status(200).json({ message: 'Warehouse medicine updated successfully', data: record });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Soft-delete an inventory record.
 * @param req Express request containing the record ID in `params.id`.
 * @param res Express response used to return the operation result.
 * @returns A promise that resolves after the response is sent.
 */
export const deleteWarehouseMedicine = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouseMedicineId = Number(req.params.id);
    const result = await warehouseMedicineService.deleteWarehouseMedicine(warehouseMedicineId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
