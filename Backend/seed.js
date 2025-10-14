import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configure dotenv to read .env file
dotenv.config();

// Import all necessary models
import User from './src/models/User.js';
import Admin from './src/models/Admin.js';
import Kiosk from './src/models/Kiosk.js';
import Employee from './src/models/Employee.js';
import Paralegal from './src/models/Paralegal.js';
import LegalIssue from './src/models/LegalIssue.js';
import Document from './src/models/Document.js';
import Submission from './src/models/Submission.js';
import Subscription from './src/models/Subscription.js';

// Import DB connection
import { connectDB } from './src/config/db.js';

const seedDatabase = async () => {
    try {
        // --- 1. CONNECT TO DATABASE ---
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected successfully.');
        console.log('='.repeat(60));

        // --- 2. CLEAR EXISTING DATA ---
        console.log('🧹 Clearing existing data...');
        await Promise.all([
            Admin.deleteMany({}),
            Employee.deleteMany({}),
            Paralegal.deleteMany({}),
            Document.deleteMany({}),
            Submission.deleteMany({}),
            LegalIssue.deleteMany({}),
            Subscription.deleteMany({}),
            Kiosk.deleteMany({}),
            User.deleteMany({}),
        ]);
        console.log('✅ All previous data cleared.');
        console.log('='.repeat(60));

        // --- 3. CREATE USERS ---
        console.log('👤 Creating users (Admin, Paralegal, Employee, Citizens)...');

        // Create Admin User
        const adminUser = await User.create({
            fullName: 'Deepak Sharma',
            aadhaarNumber: '999988887777',
            email: 'deepak.admin@example.com',
            password: 'AdminPassword123',
            role: 'admin',
        });

        // Create Paralegal User
        const paralegalUser = await User.create({
            fullName: 'Suman Devi',
            aadhaarNumber: '112233445566',
            email: 'suman.paralegal@example.com',
            password: 'ParalegalPassword123',
            role: 'paralegal',
        });

        // Create Employee User
        const employeeUser = await User.create({
            fullName: 'Vikas Singh',
            aadhaarNumber: '556677889900',
            email: 'vikas.employee@example.com',
            password: 'EmployeePassword123',
            role: 'employee',
        });

        // Create Citizen Users
        const citizens = await User.insertMany([
            {
                fullName: 'Amit Verma',
                aadhaarNumber: '123412341234',
                email: 'amit.citizen@example.com',
                password: 'CitizenPassword123',
                role: 'citizen',
            },
            {
                fullName: 'Pooja Singh',
                aadhaarNumber: '234523452345',
                email: 'pooja.citizen@example.com',
                password: 'CitizenPassword123',
                role: 'citizen',
            }
        ]);
        console.log(`✅ ${citizens.length + 3} users created successfully.`);
        console.log('='.repeat(60));


        // --- 4. CREATE KIOSK ---
        console.log('🏪 Creating Kiosk...');
        const kiosk = await Kiosk.create({
            location: 'Mathura City Center',
            village: 'Rampur',
            district: 'Mathura',
            operatorName: 'Anil Kumar',
            isActive: true,
            organizationType: 'NGO',
            organizationName: 'Nyaya Foundation',
        });
        console.log(`✅ Kiosk created: ${kiosk.location}`);
        console.log('='.repeat(60));


        // --- 5. CREATE ROLE-SPECIFIC DOCUMENTS (Admin, Paralegal, Employee) ---
        console.log('👨‍⚖️ Creating role-specific profiles...');
        
        await Admin.create({
            user: adminUser._id,
            assignedDistricts: ['Mathura', 'Agra'],
            status: 'active',
            adminRole: 'DistrictAdmin',
        });

        const paralegal = await Paralegal.create({
            user: paralegalUser._id,
            phoneNumber: '9123456789',
            areasOfExpertise: ['Land', 'Court', 'Certificates'],
            active: true,
            rating: 4.5,
        });

        await Employee.create({
            user: employeeUser._id,
            kioskId: kiosk._id,
            department: 'Legal Helpdesk',
            designation: 'Field Officer',
            permissions: { formProcessing: true, caseEscalation: false },
        });
        console.log('✅ Admin, Paralegal, and Employee profiles created.');
        console.log('='.repeat(60));


        // --- 6. CREATE LEGAL ISSUES FOR CITIZENS ---
        console.log('⚖️ Creating legal issues for citizens...');
        const issue1 = await LegalIssue.create({
            userId: citizens[0]._id,
            issueType: "Land Dispute",
            description: `Land ownership boundary issue for Amit Verma's property.`,
            status: "Pending",
            kiosk: kiosk._id,
            assignedParalegal: paralegal._id,
            history: [{ event: 'Issue Created', details: 'Initial report via Kiosk' }]
        });
        
        const issue2 = await LegalIssue.create({
            userId: citizens[1]._id,
            issueType: "Pension Issue",
            description: `Pooja Singh's widow pension has not been credited for 3 months.`,
            status: "Submitted",
            kiosk: kiosk._id,
            history: [{ event: 'Issue Created', details: 'Initial report via Kiosk' }]
        });
        console.log(`✅ ${[issue1, issue2].length} legal issues created.`);
        console.log('='.repeat(60));


        // --- 7. CREATE DOCUMENTS FOR LEGAL ISSUES ---
        console.log('📄 Adding documents for issues...');
        const doc1 = await Document.create({
            userId: citizens[0]._id,
            issueId: issue1._id,
            documentType: "Aadhaar Card",
            fileUrl: `https://example.com/docs/amit_aadhaar.pdf`,
            submissionStatus: "submitted",
        });

        const doc2 = await Document.create({
            userId: citizens[0]._id,
            issueId: issue1._id,
            documentType: "Land Registry",
            fileUrl: `https://example.com/docs/amit_land_registry.pdf`,
            submissionStatus: "submitted",
        });

        // Add document references back to the LegalIssue
        await LegalIssue.findByIdAndUpdate(issue1._id, { $push: { documents: [doc1._id, doc2._id] } });
        console.log('✅ Documents added and linked to issues.');
        console.log('='.repeat(60));
        

        // --- 8. CREATE A SUBMISSION ---
        console.log('📬 Creating a document submission...');
        await Submission.create({
            documentId: doc2._id, // Land Registry document
            submittedTo: "Tehsil Office, Mathura",
            submissionStatus: "submitted",
            submissionDate: new Date(),
        });
        console.log('✅ Submission created.');
        console.log('='.repeat(60));


        // --- 9. CREATE SUBSCRIPTIONS ---
        console.log('💳 Creating subscriptions...');
        await Subscription.create({
            organizationType: 'Kiosk',
            organizationRef: kiosk._id,
            plan: 'Premium',
            amountPaid: 5000,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            paymentStatus: 'Active',
        });
        
        await Subscription.create({
            organizationType: 'Independent',
            organizationRef: paralegalUser._id,
            plan: 'Basic',
            amountPaid: 1500,
            expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
            paymentStatus: 'Active',
        });
        console.log('✅ Subscriptions for Kiosk and Paralegal created.');
        console.log('='.repeat(60));


        // --- FINAL ---
        console.log('\n' + '🎉'.repeat(20));
        console.log('🎉 SEEDING COMPLETE! ');
        console.log('🎉 Your database is now populated with dummy data.');
        console.log('🎉'.repeat(20));

    } catch (err) {
        console.error('\n' + '❌'.repeat(30));
        console.error('❌ AN ERROR OCCURRED DURING SEEDING:');
        console.error(err.message);
        console.error('❌'.repeat(30));
        
    } finally {
        // --- DISCONNECT ---
        console.log('\n🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected successfully.');
        process.exit();
    }
};

// Run the seeder
seedDatabase();