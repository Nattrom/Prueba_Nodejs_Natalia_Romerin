import { jest, describe, expect, it, beforeEach } from "@jest/globals";

import Warehouse from '../src/models/warehouse.model';
import Medicine from '../src/models/medicine.model';
import WarehouseMedicine from '../src/models/warehouseMedicine.model';
import * as warehouseMedicineService from '../src/services/warehouseMedicine.service';

jest.mock('../src/models/warehouse.model', () => ({
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

jest.mock('../src/models/warehouseMedicine.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

const mockedWarehouse = jest.mocked(Warehouse);
const mockedMedicine = jest.mocked(Medicine);
const mockedWarehouseMedicine = jest.mocked(WarehouseMedicine);

/**
 * Verify inventory CRUD behavior, stock validation, and active relations.
 * @description Covers inventory references, stock changes, and soft deletion.
 */
describe('WarehouseMedicine service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Creates an inventory entry for valid warehouse and medicine references. */
  it('creates an inventory entry when warehouse, medicine and stock are valid', async () => {
    mockedWarehouse.findByPk.mockResolvedValue({ id: 3, name: 'Main', location: 'Bogotá', deletedAt: null } as any);
    mockedMedicine.findByPk.mockResolvedValue({ id: 8, name: 'Ibuprofen', description: null, deletedAt: null } as any);
    mockedWarehouseMedicine.findOne.mockResolvedValue(null);
    mockedWarehouseMedicine.create.mockResolvedValue({ id: 12, warehouseId: 3, medicineId: 8, stock: 50 } as any);
    mockedWarehouseMedicine.findByPk.mockResolvedValue({
      id: 12,
      warehouseId: 3,
      medicineId: 8,
      stock: 50,
      warehouse: { id: 3, name: 'Main', location: 'Bogotá' },
      medicine: { id: 8, name: 'Ibuprofen', description: null },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);

    const result = await warehouseMedicineService.createWarehouseMedicine({
      warehouseId: 3,
      medicineId: 8,
      stock: 50,
    });

    expect(result.stock).toBe(50);
    expect(mockedWarehouseMedicine.create).toHaveBeenCalledWith({
      warehouseId: 3,
      medicineId: 8,
      stock: 50,
    });
  });

  /** Excludes entries linked to soft-deleted warehouses or medicines. */
  it('lists only active warehouse-medicine entries', async () => {
    mockedWarehouseMedicine.findAll.mockResolvedValue([
      {
        id: 1,
        warehouseId: 1,
        medicineId: 1,
        stock: 8,
        warehouse: { id: 1, name: 'Main', location: 'Bogotá', deletedAt: null },
        medicine: { id: 1, name: 'Paracetamol', description: 'Pain', deletedAt: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        warehouseId: 2,
        medicineId: 2,
        stock: 7,
        warehouse: { id: 2, name: 'Old', location: 'Medellín', deletedAt: new Date() },
        medicine: { id: 2, name: 'Ibuprofen', description: null, deletedAt: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const result = await warehouseMedicineService.listWarehouseMedicines();

    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(8);
  });

  /** Rejects records whose related warehouse or medicine is deleted. */
  it('gets a warehouse-medicine by id and rejects soft-deleted relations', async () => {
    mockedWarehouseMedicine.findByPk.mockResolvedValue({
      id: 15,
      warehouseId: 4,
      medicineId: 2,
      stock: 3,
      warehouse: { id: 4, name: 'Remote', location: 'Pereira', deletedAt: null },
      medicine: { id: 2, name: 'Ibuprofen', description: null, deletedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(warehouseMedicineService.getWarehouseMedicineById(15)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Warehouse medicine not found',
    });
  });

  /** Updates stock and rejects invalid inventory payloads. */
  it('updates stock and validates payloads', async () => {
  
    const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();
    mockUpdate.mockResolvedValue(undefined);

    const entry = {
      id: 9,
      warehouseId: 3,
      medicineId: 8,
      stock: 10,
      update: mockUpdate,
    };

    mockedWarehouseMedicine.findByPk.mockResolvedValueOnce(entry as any).mockResolvedValueOnce({
      id: 9,
      warehouseId: 3,
      medicineId: 8,
      stock: 25,
      warehouse: { id: 3, name: 'Main', location: 'Bogotá' },
      medicine: { id: 8, name: 'Ibuprofen', description: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    mockedWarehouseMedicine.findOne.mockResolvedValue(null);

    const result = await warehouseMedicineService.updateWarehouseMedicine(9, { stock: 25 });

    expect(result.stock).toBe(25);
    expect(entry.update).toHaveBeenCalledWith({ stock: 25 });

    await expect(warehouseMedicineService.updateWarehouseMedicine(9, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid warehouse medicine fields were provided',
    });
  });

  /** Soft-deletes an existing inventory entry. */
  it('deletes a warehouse-medicine entry', async () => {

    const mockDestroy = jest.fn<(...args: any[]) => Promise<any>>();
    mockDestroy.mockResolvedValue(undefined);

    const entry = {
      id: 17,
      warehouseId: 2,
      medicineId: 3,
      stock: 4,
      destroy: mockDestroy,
    };

    mockedWarehouseMedicine.findByPk.mockResolvedValue(entry as any);

    const result = await warehouseMedicineService.deleteWarehouseMedicine(17);

    expect(result).toEqual({ message: 'Warehouse medicine deleted successfully' });
    expect(entry.destroy).toHaveBeenCalled();
  });
});
