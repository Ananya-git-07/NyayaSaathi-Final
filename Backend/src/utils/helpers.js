
import mongoose from 'mongoose';
export const createResponse = (success, data = null, message = '', meta = {}) => {
    return {
        success,
        message,
        data,
        timestamp: new Date().toISOString(),
        ...meta
    };
};

// Generate pagination metadata
export const generatePagination = (page, limit, totalCount) => {
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    return {
        currentPage,
        itemsPerPage,
        totalCount,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
    };
};

// Create custom error with status code
export const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Soft delete by ID with ownership check
export const softDeleteById = async (Model, id, options = {}) => {
    try {
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createError('Invalid ID format', 400);
        }

        // Build query conditions
        const queryConditions = { _id: id };
        
        // Add ownership check if required
        if (options.checkOwnership && options.userId) {
            queryConditions.userId = options.userId;
        }

        // Find the document first to check if it exists and user owns it
        const document = await Model.findOne(queryConditions);
        
        if (!document) {
            throw createError('Document not found or access denied', 404);
        }

        if (document.isDeleted) {
            throw createError('Document is already deleted', 400);
        }

        // Perform soft delete
        const updatedDocument = await Model.findByIdAndUpdate(
            id,
            { 
                isDeleted: true, 
                deletedAt: new Date() 
            },
            { new: true }
        );

        return updatedDocument;
    } catch (error) {
        // Re-throw with proper error structure
        if (error.statusCode) {
            throw error;
        }
        throw createError(`Failed to delete document: ${error.message}`, 500);
    }
};

// Restore soft deleted document by ID with ownership check
export const restoreById = async (Model, id, options = {}) => {
    try {
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createError('Invalid ID format', 400);
        }

        // Build query conditions - must include deleted documents
        const queryConditions = { _id: id, isDeleted: true };
        
        // Add ownership check if required
        if (options.checkOwnership && options.userId) {
            queryConditions.userId = options.userId;
        }

        // Find the deleted document using the withDeleted option
        const document = await Model.findOne(queryConditions, null, { withDeleted: true });
        
        if (!document) {
            throw createError('Deleted document not found or access denied', 404);
        }

        if (!document.isDeleted) {
            throw createError('Document is not deleted', 400);
        }

        // Restore the document
        const restoredDocument = await Model.findByIdAndUpdate(
            id,
            { 
                isDeleted: false, 
                deletedAt: null 
            },
            { new: true }
        );

        return restoredDocument;
    } catch (error) {
        // Re-throw with proper error structure
        if (error.statusCode) {
            throw error;
        }
        throw createError(`Failed to restore document: ${error.message}`, 500);
    }
};

// Permanently delete document by ID with ownership check
export const permanentDeleteById = async (Model, id, options = {}) => {
    try {
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createError('Invalid ID format', 400);
        }

        // Build query conditions
        const queryConditions = { _id: id };
        
        // Add ownership check if required
        if (options.checkOwnership && options.userId) {
            queryConditions.userId = options.userId;
        }

        // Find and permanently delete the document
        const deletedDocument = await Model.findOneAndDelete(queryConditions);
        
        if (!deletedDocument) {
            throw createError('Document not found or access denied', 404);
        }

        return deletedDocument;
    } catch (error) {
        // Re-throw with proper error structure
        if (error.statusCode) {
            throw error;
        }
        throw createError(`Failed to permanently delete document: ${error.message}`, 500);
    }
};

// Validate request pagination parameters
export const validatePagination = (page = 1, limit = 10, maxLimit = 100) => {
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
    
    return {
        page: validatedPage,
        limit: validatedLimit,
        skip: (validatedPage - 1) * validatedLimit
    };
};

// Validate and sanitize sort parameters
export const validateSort = (sortBy = 'createdAt', sortOrder = 'desc', allowedFields = ['createdAt', 'updatedAt']) => {
    const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
    
    return {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        sortObj: { [validSortBy]: validSortOrder === 'desc' ? -1 : 1 }
    };
};

// Check if user owns a document
export const checkOwnership = async (Model, documentId, userId) => {
    const document = await Model.findOne({ _id: documentId, userId }, { _id: 1 });
    return !!document;
};

// Batch operations helper
export const batchOperation = async (Model, ids, operation, options = {}) => {
    try {
        // Validate all IDs
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        
        if (validIds.length === 0) {
            throw createError('No valid IDs provided', 400);
        }

        let queryConditions = { _id: { $in: validIds } };
        
        // Add ownership check if required
        if (options.checkOwnership && options.userId) {
            queryConditions.userId = options.userId;
        }

        let result;
        
        switch (operation) {
            case 'softDelete':
                result = await Model.updateMany(
                    { ...queryConditions, isDeleted: false },
                    { isDeleted: true, deletedAt: new Date() }
                );
                break;
                
            case 'restore':
                result = await Model.updateMany(
                    { ...queryConditions, isDeleted: true },
                    { isDeleted: false, deletedAt: null }
                );
                break;
                
            case 'permanentDelete':
                result = await Model.deleteMany(queryConditions);
                break;
                
            default:
                throw createError('Invalid batch operation', 400);
        }

        return {
            totalRequested: ids.length,
            validIds: validIds.length,
            modified: result.modifiedCount || result.deletedCount || 0,
            result
        };
        
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        throw createError(`Batch operation failed: ${error.message}`, 500);
    }
};

export default {
    createResponse,
    generatePagination,
    createError,
    softDeleteById,
    restoreById,
    permanentDeleteById,
    validatePagination,
    validateSort,
    checkOwnership,
    batchOperation
};