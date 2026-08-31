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

import User from '../src/models/user.model';
import Clinic from '../src/models/clinic.model';
import * as clinicService from '../src/services/clinic.service';

const mockedUserModel = User as unknown as {
  findByPk: jest.Mock;
};

const mockedClinicModel = Clinic as unknown as {
  findByPk: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  findAll: jest.Mock;
};

describe('Clinic service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a clinic when the responsible user exists and the NIT is unique', async () => {
    const responsibleUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN',
    };

    mockedUserModel.findByPk.mockResolvedValue(responsibleUser);
    mockedClinicModel.findOne.mockResolvedValue(null);
    mockedClinicModel.create.mockResolvedValue({
      id: 10,
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    mockedClinicModel.findByPk.mockResolvedValue({
      id: 10,
      name: 'Central Clinic',
      nit: '900123456-7',
      responsibleUserId: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      responsibleUser: responsibleUser,
    });

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

  it('rejects duplicate NIT values', async () => {
    mockedUserModel.findByPk.mockResolvedValue({
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'ADMIN',
    });

    mockedClinicModel.findOne.mockResolvedValue({ id: 5 });

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
