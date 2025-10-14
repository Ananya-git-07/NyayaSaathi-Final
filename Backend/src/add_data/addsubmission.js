import '../db.js';
import { Submission, Document } from '../models/index.js';

const run = async () => {
  try {
    const document = await Document.findOne({ isDeleted: false });
    if (!document) {
      console.log("❌ No active document found. Please add documents first.");
      process.exit(1);
    }

    await Submission.create({
      documentId: document._id,
      submittedTo: "Tehsil Office",
      submissionStatus: "submitted",
      submissionDate: new Date(),
      isDeleted: false
    });

    console.log("✅ Submission saved successfully!");
    
  } catch (err) {
    console.error("❌ Error saving submission:", err.message);
  }
  process.exit();
};

run();
