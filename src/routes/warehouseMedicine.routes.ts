import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import {
  createWarehouseMedicine,
  deleteWarehouseMedicine,
  getWarehouseMedicineById,
  listWarehouseMedicines,
  updateWarehouseMedicine,
} from '../controllers/warehouseMedicine.controller';

const router = Router();

/**
 * @openapi
 * /api/warehouse-medicines:
 *   post:
 *     tags: [Warehouse Medicines]
 *     summary: Create warehouse medicine inventory
 *     description: Add a medicine to a warehouse with a stock amount. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, medicineId, stock]
 *             properties:
 *               warehouseId:
 *                 type: integer
 *                 example: 1
 *               medicineId:
 *                 type: integer
 *                 example: 1
 *               stock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: Warehouse medicine created successfully
 *       400:
 *         description: Invalid warehouse medicine payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse or medicine not found
 *       409:
 *         description: Duplicate warehouse-medicine combination
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), createWarehouseMedicine);

/**
 * @openapi
 * /api/warehouse-medicines:
 *   get:
 *     tags: [Warehouse Medicines]
 *     summary: List active warehouse inventory
 *     description: Returns all active warehouse-medicine inventory relationships. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouse medicine records
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), listWarehouseMedicines);

/**
 * @openapi
 * /api/warehouse-medicines/{id}:
 *   get:
 *     tags: [Warehouse Medicines]
 *     summary: Get warehouse medicine by ID
 *     description: Returns a warehouse-medicine inventory record if the related warehouse and medicine are active. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Warehouse medicine found
 *       400:
 *         description: Invalid warehouse medicine ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse medicine not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN), getWarehouseMedicineById);

/**
 * @openapi
 * /api/warehouse-medicines/{id}:
 *   put:
 *     tags: [Warehouse Medicines]
 *     summary: Update warehouse medicine inventory
 *     description: Updates the warehouse-medicine record. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               warehouseId:
 *                 type: integer
 *               medicineId:
 *                 type: integer
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Warehouse medicine updated successfully
 *       400:
 *         description: Invalid warehouse medicine payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse medicine not found
 *       409:
 *         description: Duplicate warehouse-medicine combination
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateWarehouseMedicine);

/**
 * @openapi
 * /api/warehouse-medicines/{id}:
 *   delete:
 *     tags: [Warehouse Medicines]
 *     summary: Delete warehouse medicine inventory
 *     description: Removes a warehouse-medicine inventory record. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Warehouse medicine deleted successfully
 *       400:
 *         description: Invalid warehouse medicine ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse medicine not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteWarehouseMedicine);

export default router;
