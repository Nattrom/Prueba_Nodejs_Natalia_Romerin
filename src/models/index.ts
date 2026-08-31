import User from './user.model';
import Clinic from './clinic.model';
import Warehouse from './warehouse.model';
import Medicine from './medicine.model';
import WarehouseMedicine from './warehouseMedicine.model';
import SupplyRequest from './supplyRequest.model';

// User → Clinic
Clinic.belongsTo(User, {
  foreignKey: 'responsibleUserId',
  as: 'responsibleUser',
});
User.hasMany(Clinic, {
  foreignKey: 'responsibleUserId',
  as: 'clinics',
});

// Clinic → SupplyRequest
SupplyRequest.belongsTo(Clinic, {
  foreignKey: 'clinicId',
  as: 'clinic',
});
Clinic.hasMany(SupplyRequest, {
  foreignKey: 'clinicId',
  as: 'supplyRequests',
});

// Medicine → SupplyRequest
SupplyRequest.belongsTo(Medicine, {
  foreignKey: 'medicineId',
  as: 'medicine',
});
Medicine.hasMany(SupplyRequest, {
  foreignKey: 'medicineId',
  as: 'supplyRequests',
});

// Warehouse → SupplyRequest
SupplyRequest.belongsTo(Warehouse, {
  foreignKey: 'warehouseId',
  as: 'warehouse',
});
Warehouse.hasMany(SupplyRequest, {
  foreignKey: 'warehouseId',
  as: 'supplyRequests',
});

// Warehouse ↔ Medicine via WarehouseMedicine
Warehouse.hasMany(WarehouseMedicine, {
  foreignKey: 'warehouseId',
  as: 'inventory',
});
WarehouseMedicine.belongsTo(Warehouse, {
  foreignKey: 'warehouseId',
  as: 'warehouse',
});

Medicine.hasMany(WarehouseMedicine, {
  foreignKey: 'medicineId',
  as: 'inventory',
});
WarehouseMedicine.belongsTo(Medicine, {
  foreignKey: 'medicineId',
  as: 'medicine',
});

export {
  User,
  Clinic,
  Warehouse,
  Medicine,
  WarehouseMedicine,
  SupplyRequest,
};