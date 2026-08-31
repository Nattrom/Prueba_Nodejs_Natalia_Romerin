import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

interface SupplyRequestAttributes {
  id: number;
  clinicId: number;
  medicineId: number;
  warehouseId: number;
  quantity: number;
  status: RequestStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface SupplyRequestCreationAttributes extends Optional<SupplyRequestAttributes, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class SupplyRequest extends Model<SupplyRequestAttributes, SupplyRequestCreationAttributes> implements SupplyRequestAttributes {
  public id!: number;
  public clinicId!: number;
  public medicineId!: number;
  public warehouseId!: number;
  public quantity!: number;
  public status!: RequestStatus;
  public notes!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

SupplyRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clinicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clinics',
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
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RequestStatus)),
      allowNull: false,
      defaultValue: RequestStatus.PENDING,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: 'SupplyRequest',
    tableName: 'supply_requests',
    paranoid: true,
  }
);

export default SupplyRequest;