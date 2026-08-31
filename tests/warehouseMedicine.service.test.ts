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

import Warehouse from '../src/models/warehouse.model';
import Medicine from '../src/models/medicine.model';
import WarehouseMedicine from '../src/models/warehouseMedicine.model';
import * as warehouseMedicineService from '../src/services/warehouseMedicine.service';

const mockedWarehouse = Warehouse as unknown as { findByPk: jest.Mock };
const mockedMedicine = Medicine as unknown as { findByPk: jest.Mock };
const mockedWarehouseMedicine = WarehouseMedicine as unknown as {
  findOne: jest.Mock;
  findAll: jest.Mock;
  findByPk: jest.Mock;
  create: jest.Mock;
};

describe('WarehouseMedicine service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an inventory entry when warehouse, medicine and stock are valid', async () => {
    mockedWarehouse.findByPk.mockResolvedValue({ id: 3, name: 'Main', location: 'Bogotá', deletedAt: null });
    mockedMedicine.findByPk.mockResolvedValue({ id: 8, name: 'Ibuprofen', description: null, deletedAt: null });
    mockedWarehouseMedicine.findOne.mockResolvedValue(null);
    mockedWarehouseMedicine.create.mockResolvedValue({ id: 12, warehouseId: 3, medicineId: 8, stock: 50 });
    mockedWarehouseMedicine.findByPk.mockResolvedValue({
      id: 12,
      warehouseId: 3,
      medicineId: 8,
      stock: 50,
      warehouse: { id: 3, name: 'Main', location: 'Bogotá' },
      medicine: { id: 8, name: 'Ibuprofen', description: null },
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

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
    ]);

    const result = await warehouseMedicineService.listWarehouseMedicines();

    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(8);
  });

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
    });

    await expect(warehouseMedicineService.getWarehouseMedicineById(15)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Warehouse medicine not found',
    });
  });

  it('updates stock and validates payloads', async () => {
    const entry = {
      id: 9,
      warehouseId: 3,
      medicineId: 8,
      stock: 10,
      update: jest.fn().mockResolvedValue(undefined),
    };

    mockedWarehouseMedicine.findByPk.mockResolvedValueOnce(entry).mockResolvedValueOnce({
      id: 9,
      warehouseId: 3,
      medicineId: 8,
      stock: 25,
      warehouse: { id: 3, name: 'Main', location: 'Bogotá' },
      medicine: { id: 8, name: 'Ibuprofen', description: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockedWarehouseMedicine.findOne.mockResolvedValue(null);

    const result = await warehouseMedicineService.updateWarehouseMedicine(9, { stock: 25 });

    expect(result.stock).toBe(25);
    expect(entry.update).toHaveBeenCalledWith({ stock: 25 });

    await expect(warehouseMedicineService.updateWarehouseMedicine(9, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid warehouse medicine fields were provided',
    });
  });

  it('deletes a warehouse-medicine entry', async () => {
    const entry = {
      id: 17,
      warehouseId: 2,
      medicineId: 3,
      stock: 4,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    mockedWarehouseMedicine.findByPk.mockResolvedValue(entry);

    const result = await warehouseMedicineService.deleteWarehouseMedicine(17);

    expect(result).toEqual({ message: 'Warehouse medicine deleted successfully' });
    expect(entry.destroy).toHaveBeenCalled();
  });
});
