import '../db.js';
import Kiosk from '../models/Kiosk.js';

const run = async () => {
    try {
        const kiosk = await Kiosk.create({
            location: 'Mathura City Center',
            village: 'Rampur',
            district: 'Mathura',
            operatorName: 'Amit Verma',
            isActive: true,
            numberOfEmployees: 0,
            employees: [],
            organizationType: 'Independent',
            organizationName: 'Rampur Legal Services',
            isDeleted: false
        });

        console.log('✅ Kiosk added:', kiosk._id);
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit();
};

run();
