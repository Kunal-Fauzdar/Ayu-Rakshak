// controllers/appointmentController.js
    import { Request } from "../models/request.model.js";
    import { Response } from "../models/response.model.js";
// const User = require('../models/User');

// Patient creates request (Book Now)
const createRequest = async (req, res) => {
    const { doctorId, doctorName, specialty , senderId ,senderName} = req.body;

    try {
        // Check if request already exists
        const existingRequest = await Request.findOne({
            senderId,
            receiverId: doctorId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request with this doctor'
            });
        }

        const newRequest = new Request({
            senderId,
            receiverId: doctorId,
            senderName,
            doctorName,
            specialty
        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: 'Request sent successfully',
            request: newRequest
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Doctor accepts request and schedules meeting
const scheduleAppointment = async (req, res) => {
    const { requestId, scheduledDate, scheduledTime , doctorId , doctorName} = req.body;

    try {
        const request = await Request.findById(requestId);
        
        if (!request || request.receiverId.toString() !== doctorId) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Update request status
        request.status = 'accepted';
        await request.save();

        // Create response
        const response = new Response({
            senderId: doctorId,
            receiverId: request.senderId,
            requestId: requestId,
            doctorName,
            patientName: request.senderName,
            scheduledDate: new Date(scheduledDate),
            scheduledTime
        });

        await response.save();

        return res.status(201).json({
            success: true,
            message: 'Appointment scheduled successfully',
            response
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get patient messages (responses from doctors)
const getPatientMessages = async (req, res) => {
    const {id} = req.body;

    try {
        const messages = await Response.find({ receiverId: id });

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get doctor messages (requests from patients)
const getDoctorMessages = async (req, res) => {
    const {id} = req.body;

    try {
        const messages = await Request.find({ receiverId: id });
        console.log(messages);
        return res.status(200).json({
            success: true,
            messages
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export {
    createRequest,
    scheduleAppointment,
    getPatientMessages,
    getDoctorMessages
};
