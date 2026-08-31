import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouseById,
  listWarehouses,
  updateWarehouse,
} from '../controllers/warehouse.controller';

const router = Router();

/**
 * @openapi
 * /api/warehouses:
 *   post:
 *     tags: [Warehouses]
 *     summary: Create warehouse
 *     description: Create a new warehouse. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Warehouse
 *               location:
 *                 type: string
 *                 example: Barranquilla
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Invalid warehouse payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), createWarehouse);

/**
 * @openapi
 * /api/warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: List active warehouses
 *     description: Returns all active warehouses. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouses
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), listWarehouses);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get warehouse by ID
 *     description: Returns a warehouse by ID. Requires a valid JWT and ADMIN role.
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
 *         description: Warehouse found
 *       400:
 *         description: Invalid warehouse ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN), getWarehouseById);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   put:
 *     tags: [Warehouses]
 *     summary: Update warehouse
 *     description: Updates the warehouse information. Requires a valid JWT and ADMIN role.
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       400:
 *         description: Invalid warehouse payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse not found
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   delete:
 *     tags: [Warehouses]
 *     summary: Delete warehouse
 *     description: Soft deletes a warehouse. Requires a valid JWT and ADMIN role.
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
 *         description: Warehouse deleted successfully
 *       400:
 *         description: Invalid warehouse ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Warehouse not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteWarehouse);

export default router;
