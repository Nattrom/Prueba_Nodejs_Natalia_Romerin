import User, { UserRole } from '../models/user.model';
import Clinic from '../models/clinic.model';

interface ResponsibleUserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

type ClinicWithResponsibleUser = Clinic & {
  responsibleUser?: ResponsibleUserSummary;
};

export interface ClinicPayload {
  name?: string;
  nit?: string;
  responsibleUserId?: number;
}

export interface ClinicResponse {
  id: number;
  name: string;
  nit: string;
  responsibleUserId: number;
  responsibleUser?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceError extends Error {
  statusCode: number;
}

const makeServiceError = (message: string, statusCode: number): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
};

const getClinicWithUser = async (clinicId: number): Promise<Clinic | null> => {
  return Clinic.findByPk(clinicId, {
    include: [
      {
        association: 'responsibleUser',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
  });
};

const serializeClinic = (clinic: ClinicWithResponsibleUser): ClinicResponse => ({
  id: clinic.id,
  name: clinic.name,
  nit: clinic.nit,
  responsibleUserId: clinic.responsibleUserId,
  responsibleUser: clinic.responsibleUser
    ? {
        id: clinic.responsibleUser.id,
        name: clinic.responsibleUser.name,
        email: clinic.responsibleUser.email,
        role: clinic.responsibleUser.role,
      }
    : undefined,
  createdAt: clinic.createdAt,
  updatedAt: clinic.updatedAt,
});

const validateName = (name: string | undefined, fieldName = 'Clinic name'): string => {
  if (typeof name !== 'string' || name.trim() === '') {
    throw makeServiceError(`${fieldName} is required`, 400);
  }

  return name.trim();
};

const validateNit = (nit: string | undefined): string => {
  if (typeof nit !== 'string' || nit.trim() === '') {
    throw makeServiceError('Clinic NIT is required', 400);
  }

  return nit.trim();
};

const validateResponsibleUserId = (responsibleUserId: number | undefined): number => {
  if (typeof responsibleUserId !== 'number' || !Number.isInteger(responsibleUserId) || responsibleUserId <= 0) {
    throw makeServiceError('Responsible user ID is invalid', 400);
  }

  return responsibleUserId;
};

const assertValidResponsibleUser = async (responsibleUserId: number): Promise<void> => {
  const responsibleUser = await User.findByPk(responsibleUserId, {
    attributes: ['id', 'name', 'email', 'role'],
  });

  if (!responsibleUser) {
    throw makeServiceError('Responsible user not found', 404);
  }
};

const assertUniqueNit = async (nit: string, clinicId?: number): Promise<void> => {
  const existingClinic = await Clinic.findOne({
    where: { nit },
    attributes: ['id'],
  });

  if (existingClinic && (!clinicId || existingClinic.id !== clinicId)) {
    throw makeServiceError('A clinic with this NIT already exists', 409);
  }
};

/**
 * Validate references and create a clinic with its responsible user.
 * @param payload Clinic name, NIT, and responsible user ID.
 * @returns The created clinic including its responsible user summary.
 */
export const createClinic = async (payload: ClinicPayload): Promise<ClinicResponse> => {
  const name = validateName(payload.name, 'Clinic name');
  const nit = validateNit(payload.nit);
  const responsibleUserId = validateResponsibleUserId(payload.responsibleUserId);

  await assertValidResponsibleUser(responsibleUserId);
  await assertUniqueNit(nit);

  const clinic = await Clinic.create({
    name,
    nit,
    responsibleUserId,
  });

  const createdClinic = await getClinicWithUser(clinic.id);

  if (!createdClinic) {
    throw makeServiceError('Clinic could not be created', 500);
  }

  return serializeClinic(createdClinic);
};

/**
 * List active clinics ordered from newest to oldest.
 * @returns The serialized list of active clinics.
 */
export const listClinics = async (): Promise<ClinicResponse[]> => {
  const clinics = await Clinic.findAll({
    include: [
      {
        association: 'responsibleUser',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return clinics.map(serializeClinic);
};

/**
 * Find and serialize one active clinic by ID.
 * @param clinicId Identifier of the clinic to retrieve.
 * @returns The requested clinic.
 */
export const getClinicById = async (clinicId: number): Promise<ClinicResponse> => {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw makeServiceError('Clinic ID is invalid', 400);
  }

  const clinic = await getClinicWithUser(clinicId);

  if (!clinic) {
    throw makeServiceError('Clinic not found', 404);
  }

  return serializeClinic(clinic);
};

/**
 * Update the editable fields of an active clinic.
 * @param clinicId Identifier of the clinic to update.
 * @param payload Fields to update.
 * @returns The updated clinic.
 */
export const updateClinic = async (clinicId: number, payload: ClinicPayload): Promise<ClinicResponse> => {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw makeServiceError('Clinic ID is invalid', 400);
  }

  const clinic = await Clinic.findByPk(clinicId, { paranoid: false });

  if (!clinic || clinic.deletedAt) {
    throw makeServiceError('Clinic not found', 404);
  }

  const nextPayload: Partial<ClinicPayload> = {};

  if (payload.name !== undefined) {
    nextPayload.name = validateName(payload.name, 'Clinic name');
  }

  if (payload.nit !== undefined) {
    nextPayload.nit = validateNit(payload.nit);
  }

  if (payload.responsibleUserId !== undefined) {
    nextPayload.responsibleUserId = validateResponsibleUserId(payload.responsibleUserId);
  }

  if (Object.keys(nextPayload).length === 0) {
    throw makeServiceError('No valid clinic fields were provided', 400);
  }

  if (nextPayload.responsibleUserId !== undefined) {
    await assertValidResponsibleUser(nextPayload.responsibleUserId);
  }

  if (nextPayload.nit !== undefined) {
    await assertUniqueNit(nextPayload.nit, clinicId);
  }

  await clinic.update(nextPayload);

  const updatedClinic = await getClinicWithUser(clinic.id);

  if (!updatedClinic) {
    throw makeServiceError('Clinic not found', 404);
  }

  return serializeClinic(updatedClinic);
};

/**
 * Soft-delete an active clinic.
 * @param clinicId Identifier of the clinic to delete.
 * @returns A success message.
 */
export const deleteClinic = async (clinicId: number): Promise<{ message: string }> => {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw makeServiceError('Clinic ID is invalid', 400);
  }

  const clinic = await Clinic.findByPk(clinicId, { paranoid: false });

  if (!clinic || clinic.deletedAt) {
    throw makeServiceError('Clinic not found', 404);
  }

  await clinic.destroy();

  return { message: 'Clinic deleted successfully' };
};
