jest.mock('../src/models/warehouse.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

import Warehouse from '../src/models/warehouse.model';
import * as warehouseService from '../src/services/warehouse.service';

const mockedWarehouse = Warehouse as unknown as {
  create: jest.Mock;
  findAll: jest.Mock;
  findByPk: jest.Mock;
};

describe('Warehouse service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a warehouse', async () => {
    mockedWarehouse.create.mockResolvedValue({
      id: 3,
      name: 'Main warehouse',
      location: 'Bogotá',
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    });

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

  it('lists warehouses', async () => {
    mockedWarehouse.findAll.mockResolvedValue([
      { id: 1, name: 'North', location: 'Cali', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'South', location: 'Medellín', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await warehouseService.listWarehouses();

    expect(result).toHaveLength(2);
    expect(mockedWarehouse.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
  });

  it('gets a warehouse by id', async () => {
    mockedWarehouse.findByPk.mockResolvedValue({
      id: 9,
      name: 'Central Storage',
      location: 'Cartagena',
      createdAt: new Date('2024-03-03T00:00:00.000Z'),
      updatedAt: new Date('2024-03-03T00:00:00.000Z'),
    });

    const result = await warehouseService.getWarehouseById(9);

    expect(result.name).toBe('Central Storage');
  });

  it('updates a warehouse and blocks empty updates', async () => {
    const existingWarehouse = {
      id: 5,
      name: 'Old warehouse',
      location: 'Barranquilla',
      deletedAt: null,
      update: jest.fn().mockImplementation(async (payload) => {
        Object.assign(existingWarehouse, payload);
        return existingWarehouse;
      }),
      createdAt: new Date('2024-04-04T00:00:00.000Z'),
      updatedAt: new Date('2024-04-04T00:00:00.000Z'),
    };

    mockedWarehouse.findByPk.mockResolvedValue(existingWarehouse);

    const updated = await warehouseService.updateWarehouse(5, { location: 'Pereira' });

    expect(updated.location).toBe('Pereira');
    expect(existingWarehouse.update).toHaveBeenCalledWith({ location: 'Pereira' });

    await expect(warehouseService.updateWarehouse(5, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid warehouse fields were provided',
    });
  });

  it('deletes a warehouse', async () => {
    const warehouse = {
      id: 10,
      name: 'Backup warehouse',
      location: 'Tunja',
      deletedAt: null,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    mockedWarehouse.findByPk.mockResolvedValue(warehouse);

    const result = await warehouseService.deleteWarehouse(10);

    expect(result).toEqual({ message: 'Warehouse deleted successfully' });
    expect(warehouse.destroy).toHaveBeenCalled();
  });
});
