import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ClinicAttributes {
  id: number;
  name: string;
  nit: string;
  responsibleUserId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ClinicCreationAttributes extends Optional<ClinicAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Clinic extends Model<ClinicAttributes, ClinicCreationAttributes> implements ClinicAttributes {
  public id!: number;
  public name!: string;
  public nit!: string;
  public responsibleUserId!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Clinic.init(
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
    nit: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    responsibleUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Clinic',
    tableName: 'clinics',
    paranoid: true,
  }
);

export default Clinic;