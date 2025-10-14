import '../db.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Paralegal from '../models/Paralegal.js';

const run = async () => {
    try {
        //const hashedPassword = await bcrypt.hash('Paralegal@123', 10);

        const user = await User.create({
            fullName: 'Suman Devi',
            aadhaarNumber: '112233445566',
            email: 'suman.paralegal@example.com',
            password: 'Paralegal@123',
            role: 'paralegal',
            isDeleted: false
        });

        await Paralegal.create({
            user: user._id,
            phoneNumber: '9123456789',
            areasOfExpertise: ['Land', 'Court', 'Certificates'],
            active: true,
            rating: 4.2,
            isDeleted: false
        });

        console.log('✅ Paralegal added successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit();
};

run();
