
import mongoose from 'mongoose';
const voiceQuerySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Speeds up searches for specific user's queries
    },
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegalIssue',
        required: true
    },
    transcribedText: {
        type: String,
        trim: true // Automatically removes leading/trailing whitespace
    },
    language: String,
    isDeleted: {
        type: Boolean,
        default: false,
        index: true // CRITICAL: Makes filtering for deleted items very fast
    },
    deletedAt: {
        type: Date,
        default: null // Tracks exact time of deletion for analytics/sorting
    }
}, {
    // Schema Options
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Mongoose Middleware for Soft Deletion
// Runs automatically BEFORE any query command that starts with "find"
voiceQuerySchema.pre(/^find/, function (next) {
    // Check if custom option to include deleted items has been passed
    if (this.getOptions().withDeleted !== true) {
        // If 'withDeleted' option is not set, automatically filter out deleted documents
        this.where({ isDeleted: false });
    }
    // Continue to next step in query execution
    next();
});

// Custom Static Method for finding deleted documents
// Makes code in routes cleaner and more readable
voiceQuerySchema.statics.findWithDeleted = function (query) {
    // Calls standard 'find' but passes special option to bypass the filter
    return this.find(query, null, { withDeleted: true });
};

// Create and Export the Model
const VoiceQuery = mongoose.model('VoiceQuery', voiceQuerySchema);

export default VoiceQuery;