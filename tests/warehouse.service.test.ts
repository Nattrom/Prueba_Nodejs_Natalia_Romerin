import { jest, describe, expect, it, beforeEach } from "@jest/globals";

import Warehouse from '../src/models/warehouse.model';
import * as warehouseService from '../src/services/warehouse.service';

jest.mock('../src/models/warehouse.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));


const mockedWarehouse = jest.mocked(Warehouse);

/**
 * Verify warehouse CRUD behavior and validation.
 * @description Covers creation, listing, retrieval, updates, and deletion.
 */
describe('Warehouse service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Creates and serializes a warehouse payload. */
  it('creates a warehouse', async () => {
    mockedWarehouse.create.mockResolvedValue({
      id: 3,
      name: 'Main warehouse',
      location: 'Bogotá',
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    } as any);

    const result = await warehouseService.createWarehouse({
      name: 'Main warehouse',
      location: 'Bogotá',
    });

    expect(result.location).toBe('Bogotá');
    expect(mockedWarehouse.create).toHaveBeenCalledWith({
      name: 'Main warehouse',
      location: 'Bogotá',
    });
  });

  /** Returns warehouses ordered by newest creation date. */
  it('lists warehouses', async () => {
    mockedWarehouse.findAll.mockResolvedValue([
      { id: 1, name: 'North', location: 'Cali', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'South', location: 'Medellín', createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const result = await warehouseService.listWarehouses();

    expect(result).toHaveLength(2);
    expect(mockedWarehouse.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
  });

  /** Retrieves a warehouse by its identifier. */
  it('gets a warehouse by id', async () => {
    mockedWarehouse.findByPk.mockResolvedValue({
      id: 9,
      name: 'Central Storage',
      location: 'Cartagena',
      createdAt: new Date('2024-03-03T00:00:00.000Z'),
      updatedAt: new Date('2024-03-03T00:00:00.000Z'),
    } as any);

    const result = await warehouseService.getWarehouseById(9);

    expect(result.name).toBe('Central Storage');
  });

  /** Updates valid fields and rejects an empty update payload. */
  it('updates a warehouse and blocks empty updates', async () => {
  
    const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();

    const existingWarehouse = {
      id: 5,
      name: 'Old warehouse',
      location: 'Barranquilla',
      deletedAt: null,
      update: mockUpdate,
      createdAt: new Date('2024-04-04T00:00:00.000Z'),
      updatedAt: new Date('2024-04-04T00:00:00.000Z'),
    };

    mockUpdate.mockImplementation(async (payload) => {
      Object.assign(existingWarehouse, payload);
      return existingWarehouse;
    });

    mockedWarehouse.findByPk.mockResolvedValue(existingWarehouse as any);

    const updated = await warehouseService.updateWarehouse(5, { location: 'Pereira' });

    expect(updated.location).toBe('Pereira');
    expect(existingWarehouse.update).toHaveBeenCalledWith({ location: 'Pereira' });

    await expect(warehouseService.updateWarehouse(5, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid warehouse fields were provided',
    });
  });

  /** Soft-deletes an existing warehouse. */
  it('deletes a warehouse', async () => {

    const mockDestroy = jest.fn<(...args: any[]) => Promise<any>>();
    mockDestroy.mockResolvedValue(undefined);

    const warehouse = {
      id: 10,
      name: 'Backup warehouse',
      location: 'Tunja',
      deletedAt: null,
      destroy: mockDestroy,
    };

    mockedWarehouse.findByPk.mockResolvedValue(warehouse as any);

    const result = await warehouseService.deleteWarehouse(10);

    expect(result).toEqual({ message: 'Warehouse deleted successfully' });
    expect(warehouse.destroy).toHaveBeenCalled();
  });
});
