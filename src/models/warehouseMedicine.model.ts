import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarehouseMedicineAttributes {
  id: number;
  warehouseId: number;
  medicineId: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WarehouseMedicineCreationAttributes extends Optional<WarehouseMedicineAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class WarehouseMedicine extends Model<WarehouseMedicineAttributes, WarehouseMedicineCreationAttributes> implements WarehouseMedicineAttributes {
  public id!: number;
  public warehouseId!: number;
  public medicineId!: number;
  public stock!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

WarehouseMedicine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    medicineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medicines',
        key: 'id',
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'WarehouseMedicine',
    tableName: 'warehouse_medicines',
    indexes: [
      {
        unique: true,
        fields: ['warehouseId', 'medicineId'],
        name: 'warehouse_medicine_unique',
      },
    ],
  }
);

export default WarehouseMedicine;