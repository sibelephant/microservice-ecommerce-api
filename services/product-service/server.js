import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002;

app.use(express.json());

// In-memory database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    category: 'Electronics',
    stock: 50,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest smartphone model',
    price: 699.99,
    category: 'Electronics',
    stock: 100,
    createdAt: new Date().toISOString()
  }
];

// Get all products
app.get('/products', (req, res) => {
  const { category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
  
  let filteredProducts = [...products];
  
  // Apply filters
  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    totalCount: filteredProducts.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredProducts.length / limit)
  });
});

// Get product by ID
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Create product
app.post('/products', (req, res) => {
  const { name, description, price, category, stock } = req.body;
  
  const product = {
    id: uuidv4(),
    name,
    description,
    price: parseFloat(price),
    category,
    stock: parseInt(stock),
    createdAt: new Date().toISOString()
  };
  
  products.push(product);
  res.status(201).json(product);
});

// Update product stock (internal service call)
app.patch('/products/:id/stock', (req, res) => {
  const { quantity } = req.body;
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  
  product.stock -= quantity;
  res.json(product);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'product-service', status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🛍️ Product Service running on port ${PORT}`);
});