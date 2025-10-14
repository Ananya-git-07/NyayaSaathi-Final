import '../db.js';  // Adjust path if needed
import User from '../models/User.js';

const run = async () => {
    try {
        const citizens = [
            {
                fullName: 'Amit Verma',
                aadhaarNumber: '123412341234',
                email: 'amit.citizen1@example.com',
                password: 'pass12345',
                role: 'citizen',
                isDeleted: false
            },
            {
                fullName: 'Pooja Singh',
                aadhaarNumber: '234523452345',
                email: 'pooja.citizen2@example.com',
                password: 'pass12345',
                role: 'citizen',
                isDeleted: false
            },
            {
                fullName: 'Ravi Kumar',
                aadhaarNumber: '345634563456',
                email: 'ravi.citizen3@example.com',
                password: 'pass12345',
                role: 'citizen',
                isDeleted: false
            },
            {
                fullName: 'Sunita Devi',
                aadhaarNumber: '456745674567',
                email: 'sunita.citizen4@example.com',
                password: 'pass12345',
                role: 'citizen',
                isDeleted: false
            },
            {
                fullName: 'Vikram Chauhan',
                aadhaarNumber: '567856785678',
                email: 'vikram.citizen5@example.com',
                password: 'pass12345',
                role: 'citizen',
                isDeleted: false
            }
        ];

        for (const citizen of citizens) {
            await User.create(citizen);
        }

        console.log('✅ 5 Citizens added successfully!');
    } catch (err) {
        console.error('❌ Error adding citizens:', err.message);
    }
    process.exit();
};

run();
