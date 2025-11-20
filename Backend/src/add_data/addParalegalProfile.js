import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Paralegal from '../models/Paralegal.js';

const addParalegalProfile = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find the user by email
    const email = 'ananya278@gmail.com'; // Change this to your paralegal email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.fullName} (${user.email})`);

    // Check if paralegal profile already exists
    const existingParalegal = await Paralegal.findOne({ user: user._id });
    if (existingParalegal) {
      console.log('⚠️  Paralegal profile already exists for this user');
      console.log(existingParalegal);
      process.exit(0);
    }

    // Create paralegal profile
    const paralegalData = {
      user: user._id,
      phoneNumber: user.phoneNumber || '9876543210', // Use user's phone or default
      areasOfExpertise: ['Court', 'Land', 'Aadhaar'], // Change as needed
      active: true,
      rating: 0,
      isDeleted: false
    };

    const paralegal = await Paralegal.create(paralegalData);
    console.log('✅ Paralegal profile created successfully!');
    console.log(paralegal);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addParalegalProfile();
