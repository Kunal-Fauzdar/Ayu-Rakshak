import express from 'express';
import Doctor from '../models/doctors.model.js';

const router = express.Router();

router.get('/all', async (req, res) => {
    try {
        const doctors = await Doctor.find({})
        
        return res.status(200).json({
            success: true,
            count: doctors.length,
            doctors: doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors',
            error: error.message
        });
    }
});
export default router;