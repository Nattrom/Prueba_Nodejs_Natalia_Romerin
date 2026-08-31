import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';
import upload from '../middlewares/upload.middleware';
import { uploadSeedFile } from '../controllers/seed.controller';

const router = Router();

/**
 * @openapi
 * /api/seed/upload:
 *   post:
 *     tags: [Seed]
 *     summary: Upload seed JSON file
 *     description: Upload a JSON file to seed initial database data. Requires ADMIN role. File must be valid JSON with users, clinics, warehouses, medicines, and warehouseMedicines arrays.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON file containing seed data
 *     responses:
 *       200:
 *         description: Seed data uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Seed data uploaded successfully
 *                 created:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: integer
 *                       example: 2
 *                     clinics:
 *                       type: integer
 *                       example: 2
 *                     warehouses:
 *                       type: integer
 *                       example: 2
 *                     medicines:
 *                       type: integer
 *                       example: 5
 *                     warehouseMedicines:
 *                       type: integer
 *                       example: 7
 *       400:
 *         description: Invalid file or JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: JSON file is required
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: User is not ADMIN
 *       409:
 *         description: Conflict - duplicate records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User #0 - email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/upload', authenticate, authorize(UserRole.ADMIN), upload.single('file'), uploadSeedFile);

export default router;
