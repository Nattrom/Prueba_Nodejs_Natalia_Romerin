import { jest, describe, expect, it, beforeEach } from "@jest/globals";

import sequelize from '../src/config/database';
import Clinic from '../src/models/clinic.model';
import Medicine from '../src/models/medicine.model';
import Warehouse from '../src/models/warehouse.model';
import WarehouseMedicine from '../src/models/warehouseMedicine.model';
import SupplyRequest, { RequestStatus } from '../src/models/supplyRequest.model';
import * as supplyRequestService from '../src/services/supplyRequest.service';

jest.mock('../src/models/clinic.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/models/medicine.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/models/warehouse.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/models/warehouseMedicine.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../src/models/supplyRequest.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  RequestStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
  },
}));

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
  },
}));

const mockedClinic = jest.mocked(Clinic);
const mockedMedicine = jest.mocked(Medicine);
const mockedWarehouse = jest.mocked(Warehouse);
const mockedWarehouseMedicine = jest.mocked(WarehouseMedicine);
const mockedSupplyRequest = jest.mocked(SupplyRequest);
const mockedSequelize = jest.mocked(sequelize);

describe('SupplyRequest service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a pending request when the inventory is sufficient', async () => {
    mockedClinic.findByPk.mockResolvedValue({ id: 1, name: 'Clinic A', nit: '123' } as any);
    mockedMedicine.findByPk.mockResolvedValue({ id: 2, name: 'Aspirin', description: 'Pain reliever' } as any);
    mockedWarehouse.findByPk.mockResolvedValue({ id: 3, name: 'Warehouse 1', location: 'Street 1' } as any);
    mockedWarehouseMedicine.findOne.mockResolvedValue({ id: 6, warehouseId: 3, medicineId: 2, stock: 120 } as any);
    mockedSupplyRequest.create.mockResolvedValue({ id: 11, clinicId: 1, medicineId: 2, warehouseId: 3, quantity: 10, status: RequestStatus.PENDING, notes: null } as any);
    mockedSupplyRequest.findByPk.mockResolvedValue({
      id: 11,
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 10,
      status: RequestStatus.PENDING,
      notes: null,
      clinic: { id: 1, name: 'Clinic A', nit: '123' },
      medicine: { id: 2, name: 'Aspirin', description: 'Pain reliever' },
      warehouse: { id: 3, name: 'Warehouse 1', location: 'Street 1' },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);

    const result = await supplyRequestService.createSupplyRequest({
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 10,
      notes: 'Urgent',
    });

    expect(result.status).toBe(RequestStatus.PENDING);
    expect(result.quantity).toBe(10);
    expect(mockedSupplyRequest.create).toHaveBeenCalledWith({
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 10,
      status: RequestStatus.PENDING,
      notes: 'Urgent',
    });
  });

  it('rejects creation when the stock is insufficient', async () => {
    mockedClinic.findByPk.mockResolvedValue({ id: 1, name: 'Clinic A', nit: '123' } as any);
    mockedMedicine.findByPk.mockResolvedValue({ id: 2, name: 'Aspirin', description: 'Pain reliever' } as any);
    mockedWarehouse.findByPk.mockResolvedValue({ id: 3, name: 'Warehouse 1', location: 'Street 1' } as any);
    mockedWarehouseMedicine.findOne.mockResolvedValue({ id: 6, warehouseId: 3, medicineId: 2, stock: 4 } as any);

    await expect(
      supplyRequestService.createSupplyRequest({
        clinicId: 1,
        medicineId: 2,
        warehouseId: 3,
        quantity: 10,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Insufficient stock available',
    });

    expect(mockedSupplyRequest.create).not.toHaveBeenCalled();
  });

  it('rejects invalid quantity values', async () => {
    await expect(
      supplyRequestService.createSupplyRequest({
        clinicId: 1,
        medicineId: 2,
        warehouseId: 3,
        quantity: 0,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Quantity must be an integer greater than zero',
    });
  });

  it('approves a pending request and reduces stock inside a transaction', async () => {
    const transaction = {
      LOCK: { UPDATE: 'UPDATE' },
    };

    // 3. TIPADO CORRECTO: Definimos mocks de funciones asíncronas para evitar el error 'never'
    const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();
    mockUpdate.mockResolvedValue(undefined);

    const pendingRequest = {
      id: 50,
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 5,
      status: RequestStatus.PENDING,
      notes: null,
      update: mockUpdate,
      deletedAt: null,
    };

    const mockWarehouseUpdate = jest.fn<(...args: any[]) => Promise<any>>();
    mockWarehouseUpdate.mockResolvedValue(undefined);

    const warehouseEntry = {
      id: 7,
      warehouseId: 3,
      medicineId: 2,
      stock: 20,
      update: mockWarehouseUpdate,
    };

    mockedSequelize.transaction.mockImplementation(async (callback: any) => callback(transaction));
    mockedSupplyRequest.findByPk.mockResolvedValueOnce(pendingRequest as any).mockResolvedValueOnce({
      id: 50,
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 5,
      status: RequestStatus.APPROVED,
      notes: null,
      clinic: { id: 1, name: 'Clinic A', nit: '123' },
      medicine: { id: 2, name: 'Aspirin', description: 'Pain reliever' },
      warehouse: { id: 3, name: 'Warehouse 1', location: 'Street 1' },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);
    mockedWarehouseMedicine.findOne.mockResolvedValue(warehouseEntry as any);

    const result = await supplyRequestService.updateSupplyRequestStatus(50, { status: RequestStatus.APPROVED });

    expect(result.status).toBe(RequestStatus.APPROVED);
    expect(warehouseEntry.update).toHaveBeenCalledWith({ stock: 15 }, { transaction });
    expect(mockUpdate).toHaveBeenCalledWith({ status: RequestStatus.APPROVED }, { transaction });
    expect(mockedSequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid transition like PENDING to COMPLETED', async () => {
    const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();

    const pendingRequest = {
      id: 20,
      clinicId: 1,
      medicineId: 2,
      warehouseId: 3,
      quantity: 5,
      status: RequestStatus.PENDING,
      notes: null,
      deletedAt: null,
      update: mockUpdate,
    };

    mockedSupplyRequest.findByPk.mockResolvedValue(pendingRequest as any);

    await expect(
      supplyRequestService.updateSupplyRequestStatus(20, { status: RequestStatus.COMPLETED })
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(pendingRequest.update).not.toHaveBeenCalled();
  });
});
