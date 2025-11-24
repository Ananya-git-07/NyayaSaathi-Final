import { Router } from 'express';
import ParalegalRequest from '../models/ParalegalRequest.js';
import Paralegal from '../models/Paralegal.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Get all paralegal requests (admin only) - root path for frontend compatibility
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can view all requests");
    }

    const { status } = req.query;
    const query = { isDeleted: false };
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await ParalegalRequest.find(query)
      .populate('user', 'fullName email aadhaarNumber')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, requests, "Requests retrieved successfully")
    );
  } catch (error) {
    return next(error);
  }
});

// Submit a paralegal request
router.post('/request', async (req, res, next) => {
  try {
    const { phoneNumber, areasOfExpertise, requestMessage } = req.body;

    // Check if user is a citizen
    if (req.user.role !== 'citizen') {
      throw new ApiError(400, "Only citizens can request to become paralegals");
    }

    // Check if already a paralegal
    const existingParalegal = await Paralegal.findOne({ user: req.user._id, isDeleted: false });
    if (existingParalegal) {
      throw new ApiError(400, "You are already registered as a paralegal");
    }

    // Check if there's already a request
    const existingRequest = await ParalegalRequest.findOne({ 
      user: req.user._id,
      isDeleted: false 
    });
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new ApiError(400, "You already have a pending paralegal request");
      } else if (existingRequest.status === 'approved') {
        throw new ApiError(400, "Your paralegal request has already been approved");
      } else if (existingRequest.status === 'rejected') {
        // Allow resubmission if previously rejected - delete old request
        await ParalegalRequest.findByIdAndDelete(existingRequest._id);
      }
    }

    // Validate inputs
    if (!phoneNumber || !areasOfExpertise || areasOfExpertise.length === 0) {
      throw new ApiError(400, "Phone number and areas of expertise are required");
    }

    // Create the request
    const request = await ParalegalRequest.create({
      user: req.user._id,
      phoneNumber,
      areasOfExpertise,
      requestMessage: requestMessage || '',
      status: 'pending'
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin', isDeleted: false });
    const notificationPromises = admins.map(admin => 
      Notification.create({
        recipient: admin._id,
        message: `${req.user.fullName} has requested to become a paralegal`,
        link: `/admin/paralegal-requests`
      })
    );
    await Promise.all(notificationPromises);

    return res.status(201).json(
      new ApiResponse(201, request, "Paralegal request submitted successfully")
    );
  } catch (error) {
    return next(error);
  }
});

// Get user's paralegal request status
router.get('/my-request', async (req, res, next) => {
  try {
    const request = await ParalegalRequest.findOne({ 
      user: req.user._id,
      isDeleted: false 
    }).sort({ createdAt: -1 });

    if (!request) {
      return res.status(200).json(
        new ApiResponse(200, null, "No paralegal request found")
      );
    }

    return res.status(200).json(
      new ApiResponse(200, request, "Request retrieved successfully")
    );
  } catch (error) {
    return next(error);
  }
});

// Get all paralegal requests (admin only)
router.get('/requests', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can view all requests");
    }

    const { status } = req.query;
    const query = { isDeleted: false };
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await ParalegalRequest.find(query)
      .populate('user', 'fullName email aadhaarNumber')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, requests, "Requests retrieved successfully")
    );
  } catch (error) {
    return next(error);
  }
});

// Approve/Reject paralegal request (admin only)
router.put('/requests/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can review requests");
    }

    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, "Status must be either 'approved' or 'rejected'");
    }

    const request = await ParalegalRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, "This request has already been reviewed");
    }

    // Update request
    request.status = status;
    request.adminResponse = adminResponse || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, create paralegal profile and update user role
    if (status === 'approved') {
      // Create paralegal profile
      await Paralegal.create({
        user: request.user,
        phoneNumber: request.phoneNumber,
        areasOfExpertise: request.areasOfExpertise,
        active: true,
        rating: 0,
        isDeleted: false
      });

      // Update user role
      await User.findByIdAndUpdate(request.user, { role: 'paralegal' });
    }

    // Notify the user
    const notificationMessage = status === 'approved' 
      ? `Your paralegal request has been approved! You are now a registered paralegal.`
      : `Your paralegal request has been rejected. ${adminResponse ? 'Reason: ' + adminResponse : ''}`;

    await Notification.create({
      recipient: request.user,
      message: notificationMessage,
      link: `/profile`
    });

    const updatedRequest = await ParalegalRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('reviewedBy', 'fullName');

    return res.status(200).json(
      new ApiResponse(200, updatedRequest, `Request ${status} successfully`)
    );
  } catch (error) {
    return next(error);
  }
});

// Update request at root path (for consistency with other resources)
router.put('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can review requests");
    }

    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, "Status must be either 'approved' or 'rejected'");
    }

    const request = await ParalegalRequest.findOne({ _id: id, isDeleted: false });
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, "This request has already been reviewed");
    }

    // Update request
    request.status = status;
    request.adminResponse = adminResponse || '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // If approved, create paralegal profile and update user role
    if (status === 'approved') {
      // Create paralegal profile
      await Paralegal.create({
        user: request.user,
        phoneNumber: request.phoneNumber,
        areasOfExpertise: request.areasOfExpertise,
        active: true,
        rating: 0,
        isDeleted: false
      });

      // Update user role
      await User.findByIdAndUpdate(request.user, { role: 'paralegal' });
    }

    // Notify the user
    const notificationMessage = status === 'approved' 
      ? `Your paralegal request has been approved! You are now a registered paralegal.`
      : `Your paralegal request has been rejected. ${adminResponse ? 'Reason: ' + adminResponse : ''}`;

    await Notification.create({
      recipient: request.user,
      message: notificationMessage,
      link: `/profile`
    });

    const updatedRequest = await ParalegalRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('reviewedBy', 'fullName');

    return res.status(200).json(
      new ApiResponse(200, updatedRequest, `Request ${status} successfully`)
    );
  } catch (error) {
    return next(error);
  }
});

// Delete paralegal request (admin only) - for consistency with other resources
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, "Only admins can delete requests");
    }

    const { id } = req.params;
    const request = await ParalegalRequest.findById(id);
    
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    await ParalegalRequest.findByIdAndDelete(id);

    return res.status(200).json(
      new ApiResponse(200, null, "Request deleted successfully")
    );
  } catch (error) {
    return next(error);
  }
});

export default router;
