import '../db.js';
import { User, LegalIssue, Document } from '../models/index.js';

const run = async () => {
    try {
        const citizens = await User.find({ role: 'citizen', isDeleted: false });

        if (citizens.length === 0) {
            console.log("⚠️ No citizens found. Add them first.");
            process.exit(1);
        }

        for (const citizen of citizens) {
            const issue = await LegalIssue.findOne({ userId: citizen._id, isDeleted: false });
            if (!issue) {
                console.log(`⚠️ No issue found for ${citizen.fullName}, skipping...`);
                continue;
            }

            const document = new Document({
                userId: citizen._id,
                issueId: issue._id,
                documentType: "Aadhaar Copy",  // Match allowed enums
                fileUrl: `https://example.com/docs/${citizen.fullName.replace(" ", "_")}_aadhaar.pdf`,
                submissionStatus: "submitted",
                uploadedBy: "System",
                isDeleted: false
            });

            await document.save();
            console.log(`✅ Document added for ${citizen.fullName}`);
        }

    } catch (err) {
        console.error("❌ Error adding documents:", err.message);
    }
    process.exit();
};

run();
