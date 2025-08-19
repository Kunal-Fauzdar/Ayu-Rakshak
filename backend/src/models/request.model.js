// models/Request.js
import mongoose, { Schema } from "mongoose";

const requestSchema = new mongoose.Schema({
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
    senderName: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Request = mongoose.model('Request', requestSchema);
export { Request } ;
