// models/Response.js
import mongoose, { Schema } from "mongoose";

const responseSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const Response = mongoose.model('Response', responseSchema);
export { Response };
