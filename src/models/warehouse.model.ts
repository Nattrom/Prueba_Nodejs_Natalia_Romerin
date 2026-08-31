import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface WarehouseAttributes {
  id: number;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  public id!: number;
  public name!: string;
  public location!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Warehouse.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Warehouse',
    tableName: 'warehouses',
    paranoid: true,
  }
);

export default Warehouse;