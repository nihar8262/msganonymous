import mongoose from "mongoose";
import { ca } from "zod/locales";

type ConnectionOject = {
  isConnected?: number;
};

const connection : ConnectionOject = {};

async function dbConnect() {
  if (connection.isConnected) {
    console.log("=> using existing database connection");
    return;
  }

  try{
    const db =  await mongoose.connect(process.env.MONGODB_URI!);
    connection.isConnected = db.connections[0].readyState;
    console.log("=> new database connection established");
  }
  catch (error) {
    console.log("Error connecting to database:", error);
    process.exit(1);
  }

}

export default dbConnect;