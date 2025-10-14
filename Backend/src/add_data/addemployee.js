import '../db.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/employee.js';
import Kiosk from '../models/Kiosk.js';

const run = async () => {
    try {
        const kiosk = await Kiosk.findOne();
        if (!kiosk) throw new Error('No kiosk found, add kiosk first.');

        //const hashedPassword = await bcrypt.hash('Employee@123', 10);

        const user = await User.create({
            fullName: 'Vikas Singh',
            aadhaarNumber: '556677889900',
            email: 'vikas.employee@example.com',
            password: 'Employee@123',
            role: 'employee',
            isDeleted: false
        });

        await Employee.create({
            user: user._id,
            kioskId: kiosk._id,
            department: 'Legal Helpdesk',
            designation: 'Field Officer',
            roleLevel: 'staff',
            permissions: {
                formProcessing: true,
                caseEscalation: false
            },
            isDeleted: false
        });

        console.log('✅ Employee added successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit();
};

run();
