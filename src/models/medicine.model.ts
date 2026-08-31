import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MedicineAttributes {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface MedicineCreationAttributes extends Optional<MedicineAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Medicine extends Model<MedicineAttributes, MedicineCreationAttributes> implements MedicineAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;
}

Medicine.init(
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
    description: {
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
    modelName: 'Medicine',
    tableName: 'medicines',
    paranoid: true,
  }
);

export default Medicine;