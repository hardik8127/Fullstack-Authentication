import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("DATABASE CONNECTED");
    })
    .catch((err) => {
      console.error("Database Connection Failed ", err);
    });
};

export default connectDB;
