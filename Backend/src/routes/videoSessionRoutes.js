import { Router } from "express";
import VideoSession from "../models/VideoSession.js";
import Paralegal from "../models/Paralegal.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import verifyJWT from "../middleware/authMiddleware.js";
import crypto from 'crypto';

const router = Router();

// Get all video sessions for a user
router.get("/sessions", verifyJWT, asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = {};
  
  if (req.user.role === 'citizen') {
    query.citizen = req.user._id;
  } else if (req.user.role === 'paralegal') {
    const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
    if (!paralegalDoc) {
      return res.status(200).json(new ApiResponse(200, [], "No paralegal profile found. Please contact administrator."));
    }
    query.paralegal = paralegalDoc._id;
  } else if (req.user.role === 'admin') {
    // Admins can see all sessions
    // No filter needed
  } else {
    throw new ApiError(403, "Access denied");
  }
  
  if (status) query.status = status;
  
  const sessions = await VideoSession.find(query)
    .populate('citizen', 'fullName email')
    .populate({
      path: 'paralegal',
      populate: { path: 'user', select: 'fullName email' }
    })
    .populate('issueId', 'title issueType')
    .sort({ scheduledTime: -1 });
  
  return res.status(200).json(new ApiResponse(200, sessions, "Sessions retrieved successfully"));
}));

// Get single session
router.get("/sessions/:id", verifyJWT, asyncHandler(async (req, res) => {
  const session = await VideoSession.findById(req.params.id)
    .populate('citizen', 'fullName email')
    .populate({
      path: 'paralegal',
      populate: { path: 'user', select: 'fullName email' }
    })
    .populate('issueId', 'title issueType description');
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  // Check access
  let hasAccess = false;
  if (req.user.role === 'admin') {
    hasAccess = true;
  } else if (req.user.role === 'citizen' && session.citizen._id.toString() === req.user._id.toString()) {
    hasAccess = true;
  } else if (req.user.role === 'paralegal') {
    const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
    if (paralegalDoc && session.paralegal._id.toString() === paralegalDoc._id.toString()) {
      hasAccess = true;
    }
  }
  
  if (!hasAccess) {
    throw new ApiError(403, "Access denied");
  }
  
  return res.status(200).json(new ApiResponse(200, session, "Session retrieved successfully"));
}));

// Schedule a new video session
router.post("/sessions", verifyJWT, asyncHandler(async (req, res) => {
  const { paralegalId, issueId, scheduledTime } = req.body;
  
  if (req.user.role !== 'citizen') {
    throw new ApiError(403, "Only citizens can schedule video sessions");
  }
  
  if (!paralegalId || !scheduledTime) {
    throw new ApiError(400, "Paralegal and scheduled time are required");
  }
  
  const roomId = crypto.randomUUID();
  
  const sessionData = {
    citizen: req.user._id,
    paralegal: paralegalId,
    scheduledTime,
    roomId,
  };
  
  // Only add issueId if it's provided and not empty
  if (issueId && issueId.trim() !== '') {
    sessionData.issueId = issueId;
  }
  
  const session = await VideoSession.create(sessionData);
  
  const populatedSession = await VideoSession.findById(session._id)
    .populate('citizen', 'fullName email')
    .populate({
      path: 'paralegal',
      populate: { path: 'user', select: 'fullName email' }
    })
    .populate('issueId', 'title issueType');
  
  return res.status(201).json(new ApiResponse(201, populatedSession, "Session scheduled successfully"));
}));

// Start a video session
router.patch("/sessions/:id/start", verifyJWT, asyncHandler(async (req, res) => {
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  // Check access
  let hasAccess = false;
  if (req.user.role === 'citizen' && session.citizen.toString() === req.user._id.toString()) {
    hasAccess = true;
  } else if (req.user.role === 'paralegal') {
    const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
    if (paralegalDoc && session.paralegal.toString() === paralegalDoc._id.toString()) {
      hasAccess = true;
    }
  }
  
  if (!hasAccess) {
    throw new ApiError(403, "Access denied");
  }
  
  // Allow joining if already in progress (second participant)
  if (session.status !== 'scheduled' && session.status !== 'in-progress') {
    throw new ApiError(400, "Session cannot be started");
  }
  
  // Only update if not already started
  if (session.status === 'scheduled') {
    session.status = 'in-progress';
    session.startTime = new Date();
    await session.save();
  }
  
  return res.status(200).json(new ApiResponse(200, session, "Session started"));
}));

// End a video session
router.patch("/sessions/:id/end", verifyJWT, asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  // Check access
  let hasAccess = false;
  if (req.user.role === 'citizen' && session.citizen.toString() === req.user._id.toString()) {
    hasAccess = true;
  } else if (req.user.role === 'paralegal') {
    const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
    if (paralegalDoc && session.paralegal.toString() === paralegalDoc._id.toString()) {
      hasAccess = true;
    }
  }
  
  if (!hasAccess) {
    throw new ApiError(403, "Access denied");
  }
  
  // Allow ending if in-progress, or if already completed (idempotent)
  if (session.status !== 'in-progress' && session.status !== 'completed') {
    throw new ApiError(400, "Session cannot be ended");
  }
  
  // Only update if not already completed
  if (session.status !== 'completed') {
    session.status = 'completed';
    session.endTime = new Date();
    if (session.startTime) {
      session.duration = Math.round((session.endTime - session.startTime) / 60000); // in minutes
    }
    if (notes) session.notes = notes;
    await session.save();
  }
  
  return res.status(200).json(new ApiResponse(200, session, "Session ended"));
}));

// Update recording consent
router.patch("/sessions/:id/consent", verifyJWT, asyncHandler(async (req, res) => {
  const { consent } = req.body;
  
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  if (req.user.role === 'citizen') {
    session.recordingConsent.citizen = consent;
  } else if (req.user.role === 'paralegal') {
    session.recordingConsent.paralegal = consent;
  } else {
    throw new ApiError(403, "Access denied");
  }
  
  await session.save();
  
  return res.status(200).json(new ApiResponse(200, session, "Consent updated"));
}));

// Save recording URL
router.patch("/sessions/:id/recording", verifyJWT, asyncHandler(async (req, res) => {
  const { recordingUrl } = req.body;
  
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  // Check if both parties consented
  if (!session.recordingConsent.citizen || !session.recordingConsent.paralegal) {
    throw new ApiError(403, "Both parties must consent to recording");
  }
  
  session.recordingUrl = recordingUrl;
  await session.save();
  
  return res.status(200).json(new ApiResponse(200, session, "Recording saved"));
}));

// Submit feedback
router.post("/sessions/:id/feedback", verifyJWT, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  if (req.user.role !== 'citizen') {
    throw new ApiError(403, "Only citizens can submit feedback");
  }
  
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  if (session.citizen.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied");
  }
  
  if (session.status !== 'completed') {
    throw new ApiError(400, "Can only rate completed sessions");
  }
  
  session.feedback = { rating, comment };
  await session.save();
  
  return res.status(200).json(new ApiResponse(200, session, "Feedback submitted"));
}));

// Cancel session
router.patch("/sessions/:id/cancel", verifyJWT, asyncHandler(async (req, res) => {
  const session = await VideoSession.findById(req.params.id);
  
  if (!session) {
    throw new ApiError(404, "Session not found");
  }
  
  // Check access
  let hasAccess = false;
  if (req.user.role === 'citizen' && session.citizen.toString() === req.user._id.toString()) {
    hasAccess = true;
  } else if (req.user.role === 'paralegal') {
    const paralegalDoc = await Paralegal.findOne({ user: req.user._id });
    if (paralegalDoc && session.paralegal.toString() === paralegalDoc._id.toString()) {
      hasAccess = true;
    }
  }
  
  if (!hasAccess) {
    throw new ApiError(403, "Access denied");
  }
  
  if (session.status === 'completed') {
    throw new ApiError(400, "Cannot cancel completed session");
  }
  
  session.status = 'cancelled';
  await session.save();
  
  return res.status(200).json(new ApiResponse(200, session, "Session cancelled"));
}));

export default router;
