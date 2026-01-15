import { Router } from "express";
import FAQ from "../models/FAQ.js";
import LegalRight from "../models/LegalRight.js";
import Guide from "../models/Guide.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import verifyJWT from "../middleware/authMiddleware.js";

const router = Router();

// ===== FAQ ROUTES =====

// Get all FAQs (public)
router.get("/faqs", asyncHandler(async (req, res) => {
  const { category, language, search } = req.query;
  
  let query = { isActive: true };
  
  if (category) query.category = category;
  if (language) query.language = language;
  if (search) {
    query.$text = { $search: search };
  }
  
  const faqs = await FAQ.find(query).sort({ createdAt: -1 });
  
  return res.status(200).json(new ApiResponse(200, faqs, "FAQs retrieved successfully"));
}));

// Get single FAQ
router.get("/faqs/:id", asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );
  
  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }
  
  return res.status(200).json(new ApiResponse(200, faq, "FAQ retrieved successfully"));
}));

// Mark FAQ as helpful/not helpful
router.post("/faqs/:id/feedback", asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  const field = helpful ? 'helpful' : 'notHelpful';
  
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { $inc: { [field]: 1 } },
    { new: true }
  );
  
  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }
  
  return res.status(200).json(new ApiResponse(200, faq, "Feedback recorded"));
}));

// Create FAQ (admin only)
router.post("/faqs", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can create FAQs");
  }
  
  // Validate required fields
  const { question, answer, category, language } = req.body;
  
  if (!question || !answer) {
    throw new ApiError(400, "Question and answer are required");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const faq = await FAQ.create({
    question: question.trim(),
    answer: answer.trim(),
    category: category || 'General',
    language: language || 'en',
    createdBy: req.user._id,
  });
  
  return res.status(201).json(new ApiResponse(201, faq, "FAQ created successfully"));
}));

// Update FAQ (admin only)
router.patch("/faqs/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can update FAQs");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const { question, answer, category, language } = req.body;
  const updateData = {};
  
  if (question !== undefined) updateData.question = question.trim();
  if (answer !== undefined) updateData.answer = answer.trim();
  if (category !== undefined) updateData.category = category;
  if (language !== undefined) updateData.language = language;
  
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true, runValidators: true }
  );
  
  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }
  
  return res.status(200).json(new ApiResponse(200, faq, "FAQ updated successfully"));
}));

// Delete FAQ (admin only)
router.delete("/faqs/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can delete FAQs");
  }
  
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  
  if (!faq) {
    throw new ApiError(404, "FAQ not found");
  }
  
  return res.status(200).json(new ApiResponse(200, null, "FAQ deleted successfully"));
}));

// ===== LEGAL RIGHTS ROUTES =====

// Get all legal rights (public)
router.get("/legal-rights", asyncHandler(async (req, res) => {
  const { category, language, search } = req.query;
  
  let query = { isActive: true };
  
  if (category) query.category = category;
  if (language) query.language = language;
  if (search) {
    query.$text = { $search: search };
  }
  
  const rights = await LegalRight.find(query).sort({ createdAt: -1 });
  
  return res.status(200).json(new ApiResponse(200, rights, "Legal rights retrieved successfully"));
}));

// Get single legal right
router.get("/legal-rights/:id", asyncHandler(async (req, res) => {
  const right = await LegalRight.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );
  
  if (!right) {
    throw new ApiError(404, "Legal right not found");
  }
  
  return res.status(200).json(new ApiResponse(200, right, "Legal right retrieved successfully"));
}));

// Create legal right (admin only)
router.post("/legal-rights", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can create legal rights");
  }
  
  // Validate required fields
  const { title, description, category, language, applicableLaws } = req.body;
  
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const right = await LegalRight.create({
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    language: language || 'en',
    applicableLaws: applicableLaws || [],
    createdBy: req.user._id,
  });
  
  return res.status(201).json(new ApiResponse(201, right, "Legal right created successfully"));
}));

// Update legal right (admin only)
router.patch("/legal-rights/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can update legal rights");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const { title, description, category, language, applicableLaws } = req.body;
  const updateData = {};
  
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (category !== undefined) updateData.category = category;
  if (language !== undefined) updateData.language = language;
  if (applicableLaws !== undefined) updateData.applicableLaws = applicableLaws;
  
  const right = await LegalRight.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true, runValidators: true }
  );
  
  if (!right) {
    throw new ApiError(404, "Legal right not found");
  }
  
  return res.status(200).json(new ApiResponse(200, right, "Legal right updated successfully"));
}));

// Delete legal right (admin only)
router.delete("/legal-rights/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can delete legal rights");
  }
  
  const right = await LegalRight.findByIdAndDelete(req.params.id);
  
  if (!right) {
    throw new ApiError(404, "Legal right not found");
  }
  
  return res.status(200).json(new ApiResponse(200, null, "Legal right deleted successfully"));
}));

// ===== GUIDES ROUTES =====

// Get all guides (public)
router.get("/guides", asyncHandler(async (req, res) => {
  const { category, language, difficulty, search } = req.query;
  
  let query = { isActive: true };
  
  if (category) query.category = category;
  if (language) query.language = language;
  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$text = { $search: search };
  }
  
  const guides = await Guide.find(query)
    .populate('relatedGuides', 'title description category')
    .sort({ createdAt: -1 });
  
  return res.status(200).json(new ApiResponse(200, guides, "Guides retrieved successfully"));
}));

// Get single guide
router.get("/guides/:id", asyncHandler(async (req, res) => {
  const guide = await Guide.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('relatedGuides', 'title description category');
  
  if (!guide) {
    throw new ApiError(404, "Guide not found");
  }
  
  return res.status(200).json(new ApiResponse(200, guide, "Guide retrieved successfully"));
}));

// Mark guide as helpful/not helpful
router.post("/guides/:id/feedback", asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  const field = helpful ? 'helpful' : 'notHelpful';
  
  const guide = await Guide.findByIdAndUpdate(
    req.params.id,
    { $inc: { [field]: 1 } },
    { new: true }
  );
  
  if (!guide) {
    throw new ApiError(404, "Guide not found");
  }
  
  return res.status(200).json(new ApiResponse(200, guide, "Feedback recorded"));
}));

// Create guide (admin only)
router.post("/guides", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can create guides");
  }
  
  // Validate required fields
  const { title, content, category, language, steps } = req.body;
  
  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const guide = await Guide.create({
    title: title.trim(),
    content: content.trim(),
    category: category || 'General',
    language: language || 'en',
    steps: steps || [],
    createdBy: req.user._id,
  });
  
  return res.status(201).json(new ApiResponse(201, guide, "Guide created successfully"));
}));

// Update guide (admin only)
router.patch("/guides/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can update guides");
  }
  
  // Whitelist allowed fields to prevent mass assignment
  const { title, content, category, language, steps } = req.body;
  const updateData = {};
  
  if (title !== undefined) updateData.title = title.trim();
  if (content !== undefined) updateData.content = content.trim();
  if (category !== undefined) updateData.category = category;
  if (language !== undefined) updateData.language = language;
  if (steps !== undefined) updateData.steps = steps;
  
  const guide = await Guide.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true, runValidators: true }
  );
  
  if (!guide) {
    throw new ApiError(404, "Guide not found");
  }
  
  return res.status(200).json(new ApiResponse(200, guide, "Guide updated successfully"));
}));

// Delete guide (admin only)
router.delete("/guides/:id", verifyJWT, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Only admins can delete guides");
  }
  
  const guide = await Guide.findByIdAndDelete(req.params.id);
  
  if (!guide) {
    throw new ApiError(404, "Guide not found");
  }
  
  return res.status(200).json(new ApiResponse(200, null, "Guide deleted successfully"));
}));

export default router;
