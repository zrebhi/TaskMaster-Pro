/**
 * Middleware to validate that request body exists for methods that expect it
 * Applies to POST, PUT, and PATCH requests
 */
const validateRequestBody = (req, res, next) => {
  // Only validate body for methods that typically require it
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
  
  if (methodsRequiringBody.includes(req.method)) {
    // Check if request body is missing, undefined, or empty object
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Request body is required. Please provide the necessary data.',
      });
    }
  }
  
  next();
};

module.exports = { validateRequestBody };
