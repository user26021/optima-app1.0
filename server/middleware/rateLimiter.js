const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const requestData = requests.get(key);
    
    if (now > requestData.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (requestData.count >= max) {
      return res.status(429).json({ error: message });
    }

    requestData.count++;
    next();
  };
};

module.exports = { rateLimiter };