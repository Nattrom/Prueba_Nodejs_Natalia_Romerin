import { jest, describe, expect, it, beforeEach } from "@jest/globals";

import Medicine from '../src/models/medicine.model';
import * as medicineService from '../src/services/medicine.service';

jest.mock('../src/models/medicine.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

const mockedMedicine = jest.mocked(Medicine);

/**
 * Verify medicine CRUD behavior and validation.
 * @description Covers creation, listing, retrieval, updates, and deletion.
 */
describe('Medicine service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Creates and serializes a medicine payload. */
  it('creates a medicine', async () => {
    mockedMedicine.create.mockResolvedValue({
      id: 1,
      name: 'Paracetamol',
      description: 'For pain',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);

    const result = await medicineService.createMedicine({
      name: 'Paracetamol',
      description: 'For pain',
    });

    expect(result.name).toBe('Paracetamol');
    expect(mockedMedicine.create).toHaveBeenCalledWith({
      name: 'Paracetamol',
      description: 'For pain',
    });
  });

  /** Returns medicines ordered by newest creation date. */
  it('lists medicines in descending creation order', async () => {
    mockedMedicine.findAll.mockResolvedValue([
      { id: 2, name: 'Ibuprofen', description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 1, name: 'Paracetamol', description: 'For pain', createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const result = await medicineService.listMedicines();

    expect(result).toHaveLength(2);
    expect(mockedMedicine.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
  });

  /** Retrieves a medicine by its identifier. */
  it('gets a medicine by id', async () => {
    mockedMedicine.findByPk.mockResolvedValue({
      id: 7,
      name: 'Amoxicillin',
      description: 'Antibiotic',
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
      updatedAt: new Date('2024-03-01T00:00:00.000Z'),
    } as any);

    const result = await medicineService.getMedicineById(7);

    expect(result.description).toBe('Antibiotic');
  });

  /** Updates valid fields and rejects an empty update payload. */
  it('updates a medicine and rejects missing fields', async () => {
  
    const mockUpdate = jest.fn<(...args: any[]) => Promise<any>>();
    
    const existingMedicine = {
      id: 4,
      name: 'Old name',
      description: 'Old description',
      deletedAt: null,
      update: mockUpdate,
      createdAt: new Date('2024-04-01T00:00:00.000Z'),
      updatedAt: new Date('2024-04-01T00:00:00.000Z'),
    };

    mockUpdate.mockImplementation(async (payload) => {
      Object.assign(existingMedicine, payload);
      return existingMedicine;
    });

    mockedMedicine.findByPk.mockResolvedValue(existingMedicine as any);

    const updated = await medicineService.updateMedicine(4, { name: 'New name' });

    expect(updated.name).toBe('New name');
    expect(existingMedicine.update).toHaveBeenCalledWith({ name: 'New name' });

    await expect(medicineService.updateMedicine(4, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid medicine fields were provided',
    });
  });

  /** Soft-deletes an existing medicine. */
  it('deletes a medicine when it exists', async () => {

    const mockDestroy = jest.fn<(...args: any[]) => Promise<any>>();
    mockDestroy.mockResolvedValue(undefined);

    const medicine = {
      id: 8,
      name: 'Vitamin C',
      description: null,
      deletedAt: null,
      destroy: mockDestroy,
    };

    mockedMedicine.findByPk.mockResolvedValue(medicine as any);

    const result = await medicineService.deleteMedicine(8);

    expect(result).toEqual({ message: 'Medicine deleted successfully' });
    expect(medicine.destroy).toHaveBeenCalled();
  });
});
