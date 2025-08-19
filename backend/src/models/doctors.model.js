// models/Doctor.js
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username : {
        type:String , 
        required:true , 
        unique:true},
    password : {
        type:String , 
        required:true
    },
    specialty: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    hospital: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
});
export default mongoose.model('Doctor', doctorSchema);
