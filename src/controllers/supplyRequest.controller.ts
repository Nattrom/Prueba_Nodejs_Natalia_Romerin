import { Request, Response } from 'express';
import * as supplyRequestService from '../services/supplyRequest.service';

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
 * Create a new supply request.
 */
export const createSupplyRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await supplyRequestService.createSupplyRequest(req.body);
    res.status(201).json({ message: 'Supply request created successfully', data: request });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * List all active supply requests (ADMIN only).
 */
export const listAllSupplyRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await supplyRequestService.listAllSupplyRequests();
    res.status(200).json({ data: requests });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * List active/non-terminal supply requests (PENDING, APPROVED).
 */
export const listActiveSupplyRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await supplyRequestService.listActiveSupplyRequests();
    res.status(200).json({ data: requests });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Get supply request history for a clinic.
 */
export const getSupplyRequestHistoryByClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.clinicId);
    const requests = await supplyRequestService.getSupplyRequestHistoryByClinic(clinicId);
    res.status(200).json({ data: requests });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Get supply request by ID.
 */
export const getSupplyRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplyRequestId = Number(req.params.id);
    const request = await supplyRequestService.getSupplyRequestById(supplyRequestId);
    res.status(200).json({ data: request });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Update supply request status.
 */
export const updateSupplyRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplyRequestId = Number(req.params.id);
    const request = await supplyRequestService.updateSupplyRequestStatus(supplyRequestId, req.body);
    res.status(200).json({ message: 'Supply request status updated successfully', data: request });
  } catch (error) {
    handleControllerError(error, res);
  }
};
