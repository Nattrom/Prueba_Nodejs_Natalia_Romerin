import { Request, Response } from 'express';
import * as clinicService from '../services/clinic.service';

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
 * Create a clinic from the request payload.
 * @param req Express request containing clinic data in the body.
 * @param res Express response used to return the created clinic.
 * @returns A promise that resolves after the response is sent.
 */
export const createClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinic = await clinicService.createClinic(req.body);
    res.status(201).json({ message: 'Clinic created successfully', data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return all registered clinics.
 * @param _req Express request, unused by this collection endpoint.
 * @param res Express response used to return the clinics.
 * @returns A promise that resolves after the response is sent.
 */
export const listClinics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clinics = await clinicService.listClinics();
    res.status(200).json({ data: clinics });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Return a clinic identified by its route parameter.
 * @param req Express request containing the clinic ID in `params.id`.
 * @param res Express response used to return the clinic.
 * @returns A promise that resolves after the response is sent.
 */
export const getClinicById = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const clinic = await clinicService.getClinicById(clinicId);
    res.status(200).json({ data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Update an existing clinic.
 * @param req Express request containing the clinic ID and update body.
 * @param res Express response used to return the updated clinic.
 * @returns A promise that resolves after the response is sent.
 */
export const updateClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const clinic = await clinicService.updateClinic(clinicId, req.body);
    res.status(200).json({ message: 'Clinic updated successfully', data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

/**
 * Soft-delete a clinic.
 * @param req Express request containing the clinic ID in `params.id`.
 * @param res Express response used to return the operation result.
 * @returns A promise that resolves after the response is sent.
 */
export const deleteClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const result = await clinicService.deleteClinic(clinicId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
