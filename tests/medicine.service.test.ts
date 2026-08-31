jest.mock('../src/models/medicine.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

import Medicine from '../src/models/medicine.model';
import * as medicineService from '../src/services/medicine.service';

const mockedMedicine = Medicine as unknown as {
  create: jest.Mock;
  findAll: jest.Mock;
  findByPk: jest.Mock;
};

describe('Medicine service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a medicine', async () => {
    mockedMedicine.create.mockResolvedValue({
      id: 1,
      name: 'Paracetamol',
      description: 'For pain',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

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

  it('lists medicines in descending creation order', async () => {
    mockedMedicine.findAll.mockResolvedValue([
      { id: 2, name: 'Ibuprofen', description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 1, name: 'Paracetamol', description: 'For pain', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await medicineService.listMedicines();

    expect(result).toHaveLength(2);
    expect(mockedMedicine.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
  });

  it('gets a medicine by id', async () => {
    mockedMedicine.findByPk.mockResolvedValue({
      id: 7,
      name: 'Amoxicillin',
      description: 'Antibiotic',
      createdAt: new Date('2024-03-01T00:00:00.000Z'),
      updatedAt: new Date('2024-03-01T00:00:00.000Z'),
    });

    const result = await medicineService.getMedicineById(7);

    expect(result.description).toBe('Antibiotic');
  });

  it('updates a medicine and rejects missing fields', async () => {
    const existingMedicine = {
      id: 4,
      name: 'Old name',
      description: 'Old description',
      deletedAt: null,
      update: jest.fn().mockImplementation(async (payload) => {
        Object.assign(existingMedicine, payload);
        return existingMedicine;
      }),
      createdAt: new Date('2024-04-01T00:00:00.000Z'),
      updatedAt: new Date('2024-04-01T00:00:00.000Z'),
    };

    mockedMedicine.findByPk.mockResolvedValue(existingMedicine);

    const updated = await medicineService.updateMedicine(4, { name: 'New name' });

    expect(updated.name).toBe('New name');
    expect(existingMedicine.update).toHaveBeenCalledWith({ name: 'New name' });

    await expect(medicineService.updateMedicine(4, {})).rejects.toMatchObject({
      statusCode: 400,
      message: 'No valid medicine fields were provided',
    });
  });

  it('deletes a medicine when it exists', async () => {
    const medicine = {
      id: 8,
      name: 'Vitamin C',
      description: null,
      deletedAt: null,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    mockedMedicine.findByPk.mockResolvedValue(medicine);

    const result = await medicineService.deleteMedicine(8);

    expect(result).toEqual({ message: 'Medicine deleted successfully' });
    expect(medicine.destroy).toHaveBeenCalled();
  });
});
