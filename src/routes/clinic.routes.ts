import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import {
  createClinic,
  deleteClinic,
  getClinicById,
  listClinics,
  updateClinic,
} from '../controllers/clinic.controller';

const router = Router();

/**
 * @openapi
 * /api/clinics:
 *   post:
 *     tags: [Clinics]
 *     summary: Create a clinic
 *     description: Create a new clinic. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, nit, responsibleUserId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Central Clinic
 *               nit:
 *                 type: string
 *                 example: 900123456-7
 *               responsibleUserId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Clinic created successfully
 *       400:
 *         description: Invalid clinic payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Responsible user not found
 *       409:
 *         description: Duplicate clinic NIT
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), createClinic);

/**
 * @openapi
 * /api/clinics:
 *   get:
 *     tags: [Clinics]
 *     summary: Get all active clinics
 *     description: Returns all active clinics. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of active clinics
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), listClinics);

/**
 * @openapi
 * /api/clinics/{id}:
 *   get:
 *     tags: [Clinics]
 *     summary: Get clinic by ID
 *     description: Returns a single active clinic by ID. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clinic ID
 *     responses:
 *       200:
 *         description: Clinic found
 *       400:
 *         description: Invalid clinic ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Clinic not found
 */
router.get('/:id', authenticate, authorize(UserRole.ADMIN), getClinicById);

/**
 * @openapi
 * /api/clinics/{id}:
 *   put:
 *     tags: [Clinics]
 *     summary: Update a clinic
 *     description: Updates clinic fields. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clinic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Clinic
 *               nit:
 *                 type: string
 *                 example: 900123456-8
 *               responsibleUserId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Clinic updated successfully
 *       400:
 *         description: Invalid clinic payload
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Clinic not found
 *       409:
 *         description: Duplicate clinic NIT
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateClinic);

/**
 * @openapi
 * /api/clinics/{id}:
 *   delete:
 *     tags: [Clinics]
 *     summary: Delete a clinic
 *     description: Soft deletes a clinic. Requires a valid JWT and ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Clinic ID
 *     responses:
 *       200:
 *         description: Clinic deleted successfully
 *       400:
 *         description: Invalid clinic ID
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not an ADMIN
 *       404:
 *         description: Clinic not found
 */
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteClinic);

export default router;
