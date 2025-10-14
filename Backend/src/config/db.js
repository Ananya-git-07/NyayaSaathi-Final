// // import mongoose from 'mongoose';

// // export const connectDB = async () => {
// //   try {
// //     await mongoose.connect(process.env.MONGO_URL);
// //     console.log('✅ Connected to MongoDB');
// //   } catch (err) {
// //     console.error('❌ MongoDB connection error:', err.message);
// //     process.exit(1); // Exit process with failure
// //   }
// // };
// import mongoose from 'mongoose';

// export const connectDB = async () => {
//   try {
//     const connectionString = process.env.MONGO_URL;

//     if (!connectionString) {
//       console.error('❌ FATAL ERROR: MONGODB_URI is not defined in the .env file.');
//       process.exit(1); // Stop the server if the database URI is missing
//     }

//     const connectionInstance = await mongoose.connect(connectionString);
    
//     console.log(`\n✅ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    
//   } catch (error) {
//     console.error('❌ MongoDB connection error:', error.message);
//     process.exit(1); // Exit process with failure
//   }

// };

// File: Backend/src/config/db.js

import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Step 1: Look for the consistent variable name 'MONGO_URL'
    const connectionString = process.env.MONGO_URL;

    // Step 2: Check if it exists and provide a clear error if it doesn't
    if (!connectionString) {
      console.error('❌ FATAL ERROR: MONGO_URL is not defined in the .env file.');
      process.exit(1); // Stop the server if the database URI is missing
    }

    // Step 3: Connect to the database
    const connectionInstance = await mongoose.connect(connectionString);
    
    console.log(`\n✅ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit process with failure
  }
};