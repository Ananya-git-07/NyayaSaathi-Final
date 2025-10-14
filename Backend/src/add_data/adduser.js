import '../db.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const run = async () => {
    try {
        //const hashedPassword = await bcrypt.hash('User@123', 10);

        const user = await User.create({
            fullName: 'Ramesh Kumar',
            aadhaarNumber: '123456789011',
            email: 'ramesh@example.com',
            password: 'User@123',
            role: 'employee',
            isDeleted: false
        });

        console.log('✅ User added:', user._id);
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit();
};

run();
