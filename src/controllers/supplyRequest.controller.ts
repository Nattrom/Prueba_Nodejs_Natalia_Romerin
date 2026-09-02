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
 * @param req Express request containing supply request data in the body.
 * @param res Express response used to return the created request.
 * @returns A promise that resolves after the response is sent.
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
 * @param _req Express request, unused by this collection endpoint.
 * @param res Express response used to return the requests.
 * @returns A promise that resolves after the response is sent.
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
 * @param _req Express request, unused by this collection endpoint.
 * @param res Express response used to return the requests.
 * @returns A promise that resolves after the response is sent.
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
 * @param req Express request containing the clinic ID in `params.clinicId`.
 * @param res Express response used to return the request history.
 * @returns A promise that resolves after the response is sent.
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
 * @param req Express request containing the request ID in `params.id`.
 * @param res Express response used to return the request.
 * @returns A promise that resolves after the response is sent.
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
 * @param req Express request containing the request ID and new status.
 * @param res Express response used to return the updated request.
 * @returns A promise that resolves after the response is sent.
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
