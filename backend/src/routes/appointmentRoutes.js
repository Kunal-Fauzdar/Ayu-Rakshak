// routes/appointmentRoutes.js
import { Router } from "express";
import  {
    createRequest,
    scheduleAppointment,
    getPatientMessages,
    getDoctorMessages
} from '../controllers/appointmentController.js';

const router = Router();

router.post('/request',createRequest);
router.post('/schedule',scheduleAppointment);
router.post('/patient-messages',getPatientMessages);
router.post('/doctor-messages',getDoctorMessages);

export default router;

