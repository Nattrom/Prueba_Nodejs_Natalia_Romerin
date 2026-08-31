import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import {
  createSupplyRequest,
  listAllSupplyRequests,
  listActiveSupplyRequests,
  getSupplyRequestHistoryByClinic,
  getSupplyRequestById,
  updateSupplyRequestStatus,
} from '../controllers/supplyRequest.controller';

const router = Router();

/**
 * @openapi
 * /api/supply-requests:
 *   post:
 *     tags: [Supply Requests]
 *     summary: Create supply request
 *     description: Create a new supply request. Requires a valid JWT and ADMIN or REQUEST_MANAGER role. The request is created with PENDING status and stock is NOT reserved.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clinicId, medicineId, warehouseId, quantity]
 *             properties:
 *               clinicId:
 *                 type: integer
 *                 example: 1
 *               medicineId:
 *                 type: integer
 *                 example: 1
 *               warehouseId:
 *                 type: integer
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               notes:
 *                 type: string
 *                 example: Urgent supply needed
 *     responses:
 *       201:
 *         description: Supply request created successfully
 *       400:
 *         description: Invalid request payload or insufficient stock
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN or REQUEST_MANAGER
 *       404:
 *         description: Clinic, medicine, warehouse, or inventory record not found
 */
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.REQUEST_MANAGER), createSupplyRequest);

/**
 * @openapi
 * /api/supply-requests:
 *   get:
 *     tags: [Supply Requests]
 *     summary: List all active supply requests
 *     description: Returns all active (non-deleted) supply requests. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of supply requests
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), listAllSupplyRequests);

/**
 * @openapi
 * /api/supply-requests/active:
 *   get:
 *     tags: [Supply Requests]
 *     summary: List active/non-terminal supply requests
 *     description: Returns active supply requests (PENDING and APPROVED statuses). Requires ADMIN or REQUEST_MANAGER role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active supply requests
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN or REQUEST_MANAGER
 */
router.get('/active', authenticate, authorize(UserRole.ADMIN, UserRole.REQUEST_MANAGER), listActiveSupplyRequests);

/**
 * @openapi
 * /api/supply-requests/history/{clinicId}:
 *   get:
 *     tags: [Supply Requests]
 *     summary: Get supply request history for a clinic
 *     description: Returns complete request history for a clinic (all statuses). Requires ADMIN or REQUEST_MANAGER role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clinicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Supply request history for clinic
 *       400:
 *         description: Invalid clinic ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN or REQUEST_MANAGER
 *       404:
 *         description: Clinic not found
 */
router.get('/history/:clinicId', authenticate, authorize(UserRole.ADMIN, UserRole.REQUEST_MANAGER), getSupplyRequestHistoryByClinic);

/**
 * @openapi
 * /api/supply-requests/{id}:
 *   get:
 *     tags: [Supply Requests]
 *     summary: Get supply request by ID
 *     description: Returns a specific supply request by ID. Requires ADMIN or REQUEST_MANAGER role.
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
 *         description: Supply request found
 *       400:
 *         description: Invalid supply request ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN or REQUEST_MANAGER
 *       404:
 *         description: Supply request not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.REQUEST_MANAGER), getSupplyRequestById);

/**
 * @openapi
 * /api/supply-requests/{id}/status:
 *   put:
 *     tags: [Supply Requests]
 *     summary: Update supply request status
 *     description: Update a supply request status. PENDING→APPROVED reduces inventory with transaction. Requires ADMIN or REQUEST_MANAGER role.
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED, COMPLETED]
 *                 example: APPROVED
 *     responses:
 *       200:
 *         description: Supply request status updated successfully
 *       400:
 *         description: Invalid status or invalid status transition or insufficient stock
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN or REQUEST_MANAGER
 *       404:
 *         description: Supply request not found
 */
router.put('/:id/status', authenticate, authorize(UserRole.ADMIN, UserRole.REQUEST_MANAGER), updateSupplyRequestStatus);

export default router;
