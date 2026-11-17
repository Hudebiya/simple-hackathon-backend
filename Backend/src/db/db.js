import dns from 'node:dns/promises'
dns.setServers(['1.1.1.1','8.8.8.8'])

import mongoose from "mongoose"

let connectionPromise;

function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        console.log("Connected to DB");
      })
      .catch(error => {
        console.error("Error connecting to DB", error);
        process.exitCode = 1;
        throw error;
      });
  }

  return connectionPromise;
}

export default connectDB;