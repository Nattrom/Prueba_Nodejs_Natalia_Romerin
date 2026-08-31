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

export const createClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinic = await clinicService.createClinic(req.body);
    res.status(201).json({ message: 'Clinic created successfully', data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const listClinics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const clinics = await clinicService.listClinics();
    res.status(200).json({ data: clinics });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const getClinicById = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const clinic = await clinicService.getClinicById(clinicId);
    res.status(200).json({ data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const updateClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const clinic = await clinicService.updateClinic(clinicId, req.body);
    res.status(200).json({ message: 'Clinic updated successfully', data: clinic });
  } catch (error) {
    handleControllerError(error, res);
  }
};

export const deleteClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = Number(req.params.id);
    const result = await clinicService.deleteClinic(clinicId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
};
