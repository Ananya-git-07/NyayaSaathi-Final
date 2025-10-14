import '../db.js';
import LegalIssue from '../models/LegalIssue.js';

await LegalIssue.deleteMany({});
console.log("🧹 All legal issues deleted");
process.exit();