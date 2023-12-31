import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'


const connectDB = async () => {
    try {
        const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MongoDB connection Succeeded", connectionInstant.connection.host);

    } catch (error) {
        console.log("MongoDB connection Failed::::", error);
        process.exit(1);
        // exit the process with failure
    }
}

export default connectDB;