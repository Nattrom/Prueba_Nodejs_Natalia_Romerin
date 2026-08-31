import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import {
  createMedicine,
  deleteMedicine,
  getMedicineById,
  listMedicines,
  updateMedicine,
} from '../controllers/medicine.controller';

const router = Router();

/**
 * @openapi
 * /api/medicines:
 *   post:
 *     tags: [Medicines]
 *     summary: Create medicine
 *     description: Create a new medicine. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Paracetamol
 *               description:
 *                 type: string
 *                 example: Analgesic and antipyretic medication
 *     responses:
 *       201:
 *         description: Medicine created successfully
 *       400:
 *         description: Invalid medicine payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), createMedicine);

/**
 * @openapi
 * /api/medicines:
 *   get:
 *     tags: [Medicines]
 *     summary: List active medicines
 *     description: Returns all active medicines. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of medicines
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), listMedicines);

/**
 * @openapi
 * /api/medicines/{id}:
 *   get:
 *     tags: [Medicines]
 *     summary: Get medicine by ID
 *     description: Returns a medicine by ID. Requires a valid JWT and ADMIN role.
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
 *         description: Medicine found
 *       400:
 *         description: Invalid medicine ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Medicine not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN), getMedicineById);

/**
 * @openapi
 * /api/medicines/{id}:
 *   put:
 *     tags: [Medicines]
 *     summary: Update medicine
 *     description: Updates medicine information. Requires a valid JWT and ADMIN role.
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medicine updated successfully
 *       400:
 *         description: Invalid medicine payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Medicine not found
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateMedicine);

/**
 * @openapi
 * /api/medicines/{id}:
 *   delete:
 *     tags: [Medicines]
 *     summary: Delete medicine
 *     description: Soft deletes a medicine. Requires a valid JWT and ADMIN role.
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
 *         description: Medicine deleted successfully
 *       400:
 *         description: Invalid medicine ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Medicine not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteMedicine);

export default router;
