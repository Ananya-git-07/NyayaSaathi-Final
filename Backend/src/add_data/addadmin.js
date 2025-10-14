import '../db.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const run = async () => {
    try {
        const user = await User.create({
            fullName: 'Deepak Sharma',
            aadhaarNumber: '999988887779',
            email: 'deepak.admin1@example.com',
            password: 'securePassword123',  // Plain password; gets hashed in pre-save
            role: 'admin',
            isDeleted: false
        });

        const admin = await Admin.create({
            user: user._id,
            assignedDistricts: ['Mathura', 'Agra'],
            status: 'active',
            adminRole: 'DistrictAdmin',
            isDeleted: false
        });

        console.log('✅ Admin added successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit();
};

run();
