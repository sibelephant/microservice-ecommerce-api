export const loadBalancer = (serviceUrls) => {
  let currentIndex = 0;
  
  return (req, res, next) => {
    // Simple round-robin load balancing
    const selectedService = serviceUrls[currentIndex % serviceUrls.length];
    req.selectedService = selectedService;
    currentIndex++;
    next();
  };
};