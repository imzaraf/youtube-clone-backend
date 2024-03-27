import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'

// database connection must have async await 
// just because it always away from us (another continent) 
// so couldn't get immediately it takes some time
const connectDB = async () => {
    try {
        const connectionInstance = 
        await mongoose.
        connect(`${process.env.MONGODB_URI}/
        ${DB_NAME}`);
        console.log("MongoDB connection Succeeded",
        connectionInstance.connection.host);

    } catch (error) {
        console.log("MongoDB connection Failed::::",
        error);
        process.exit(1);
    }
}
export default connectDB;