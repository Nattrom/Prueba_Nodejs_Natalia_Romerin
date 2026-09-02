import { jest, describe, expect, it, beforeEach } from "@jest/globals";

import User from '../src/models/user.model';
import Clinic from '../src/models/clinic.model';
import * as clinicService from '../src/services/clinic.service';

jest.mock('../src/models/user.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
  UserRole: {
    ADMIN: 'ADMIN',
    REQUEST_MANAGER: 'REQUEST_MANAGER',
  },
}));

jest.mock('../src/models/clinic.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  },
}));


const mockedUserModel = jest.mocked(User);
const mockedClinicModel = jest.mocked(Clinic);

/**
 * Verify clinic creation and uniqueness rules.
 * @description Covers responsible-user validation and NIT uniqueness.
 */
describe('Clinic service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Creates a clinic only after validating its responsible user and NIT. */
  it('creates a clinic when the responsible user exists and the NIT is unique', async () => {
    const responsibleUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN',
    };

    
    mockedUserModel.findByPk.mockResolvedValue(responsibleUser as any);
    mockedClinicModel.findOne.mockResolvedValue(null);
    mockedClinicModel.create.mockResolvedValue({
      id: 10,
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);
    mockedClinicModel.findByPk.mockResolvedValue({
      id: 10,
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      responsibleUser: responsibleUser,
    } as any);

    const result = await clinicService.createClinic({
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
    });

    expect(result.name).toBe('Central Clinic');
    expect(result.responsibleUserId).toBe(1);
    expect(mockedUserModel.findByPk).toHaveBeenCalledWith(1, {
      attributes: ['id', 'name', 'email', 'role'],
    });
    expect(mockedClinicModel.create).toHaveBeenCalledWith({
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
    });
  });

  /** Prevents two clinics from sharing the same NIT. */
  it('rejects duplicate NIT values', async () => {
    mockedUserModel.findByPk.mockResolvedValue({
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'ADMIN',
    } as any);

    mockedClinicModel.findOne.mockResolvedValue({ id: 5 } as any);

    await expect(
      clinicService.createClinic({
        name: 'Duplicate Clinic',
        nit: '900123456-7',
        responsibleUserId: 2,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'A clinic with this NIT already exists',
    });

    expect(mockedClinicModel.create).not.toHaveBeenCalled();
  });
});
