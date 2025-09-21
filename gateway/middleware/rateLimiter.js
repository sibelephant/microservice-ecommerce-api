const requests = new Map();

export const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!requests.has(ip)) {
    requests.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const requestData = requests.get(ip);
  
  if (now > requestData.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (requestData.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  requestData.count++;
  next();
};
