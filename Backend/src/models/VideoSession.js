import mongoose from "mongoose";

const videoSessionSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalIssue',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paralegal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paralegal',
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    recordingUrl: {
      type: String,
    },
    recordingConsent: {
      citizen: {
        type: Boolean,
        default: false,
      },
      paralegal: {
        type: Boolean,
        default: false,
      },
    },
    notes: {
      type: String,
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
    },
  },
  { timestamps: true }
);

const VideoSession = mongoose.model("VideoSession", videoSessionSchema);
export default VideoSession;
