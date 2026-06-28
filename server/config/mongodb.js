import mongoose from "mongoose";


const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database Connected successfully")
    } catch(error) {
        console.log("Error occured on database connection")
    }

}

export default connectDB;