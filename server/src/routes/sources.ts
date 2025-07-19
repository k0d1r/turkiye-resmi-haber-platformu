import { Router } from 'express';
import { database } from '../database/database';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/types';

const router = Router();

// Tüm kaynakları getir
router.get('/', asyncHandler(async (req, res) => {
  const sources = await database.all('SELECT * FROM sources ORDER BY name');
  
  const response: ApiResponse = {
    success: true,
    data: sources
  };

  res.json(response);
}));

export { router as sourcesRoutes }; 