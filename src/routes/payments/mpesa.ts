import express, { Request, Response, NextFunction } from "express";
import { initiateMpesaPayment, mpesaCallback } from '../../controllers/mpesaController';
const router = express.Router();

router.post('/initiate', initiateMpesaPayment);
router.post('/callback', mpesaCallback);

export default router; 