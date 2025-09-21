import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { loadBalancer } from './middleware/loadBalancer.js';

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Service Registry - In production, this would be dynamic
const services = {
  users: ['http://localhost:3001'],
  products: ['http://localhost:3002'],
  orders: ['http://localhost:3003']
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is healthy', timestamp: new Date().toISOString() });
});

// Proxy routes with load balancing
app.use('/api/users', 
  loadBalancer(services.users),
  createProxyMiddleware({
    target: services.users[0],
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' }
  })
);

app.use('/api/products',
  loadBalancer(services.products),
  createProxyMiddleware({
    target: services.products[0],
    changeOrigin: true,
    pathRewrite: { '^/api/products': '' }
  })
);

app.use('/api/orders',
  authenticateToken,
  loadBalancer(services.orders),
  createProxyMiddleware({
    target: services.orders[0],
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' }
  })
);

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});