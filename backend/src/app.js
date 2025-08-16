import express from "express";
import {createServer} from "node:http";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from './routes/users.routes.js';  

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port",(process.env.PORT || 5051));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));
app.use("/api/v1/users", userRoutes);
const start = async()=>{
    const connectiondb = await mongoose.connect("mongodb+srv://kunalfauzdar4:May$8kunal@cluster0.ucnm6cx.mongodb.net/")
    console.log(`Mongo Connected DB Host : ${connectiondb.connection.host}`)
    server.listen(app.get("port"),()=>{
        console.log(`Server is running on port ${app.get("port")}`);
    });
}
start();

