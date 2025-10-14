import '../db.js';
import { User, LegalIssue, Kiosk, Paralegal } from '../models/index.js';

const run = async () => {
    try {
        const citizens = await User.find({ role: 'citizen', isDeleted: false });
        const kiosk = await Kiosk.findOne({ isDeleted: false });
        const paralegal = await Paralegal.findOne({ isDeleted: false });

        if (citizens.length === 0 || !kiosk) {
            console.log("⚠️ Add citizens and at least one kiosk first.");
            process.exit(1);
        }

        for (const citizen of citizens) {
            const issue = new LegalIssue({
                userId: citizen._id,
                issueType: "Land Dispute",  // Match your allowed enums
                description: `Land ownership issue reported by ${citizen.fullName}`,
                status: "Pending",
                kiosk: kiosk._id,
                assignedParalegal: paralegal ? paralegal._id : undefined,
                isDeleted: false
            });

            await issue.save();
            console.log(`✅ Issue added for ${citizen.fullName}`);
        }

    } catch (err) {
        console.error("❌ Error adding legal issues:", err.message);
    }
    process.exit();
};

run();
