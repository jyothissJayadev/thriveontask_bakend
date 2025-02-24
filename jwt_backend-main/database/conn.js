import mongoose from "mongoose";
const mongoDb = "mongodb://127.0.0.1:27017/Dashboard";
const connectDb = async () => {
  const db = await mongoose.connect(mongoDb);
  console.log("connection establoished", db.connection.host);
  return db;
};

export default connectDb;
