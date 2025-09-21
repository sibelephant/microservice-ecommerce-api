import express from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;

app.use(express.json());

// Service URLs (in production, use service discovery)
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3001";
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";

// In-memory database
let orders = [];

// Create order
app.post("/orders", async (req, res) => {
  try {
    const { userId, items } = req.body; // items: [{ productId, quantity }]

    // Verify user exists
    try {
      await axios.get(`${USER_SERVICE_URL}/profile/${userId}`);
    } catch (error) {
      return res.status(400).json({ error: "Invalid user" });
    }

    // Verify products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      try {
        const productResponse = await axios.get(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}`
        );
        const product = productResponse.data;

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for product ${product.name}`,
          });
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal: itemTotal,
        });

        // Update product stock
        await axios.patch(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}/stock`,
          {
            quantity: item.quantity,
          }
        );
      } catch (error) {
        return res.status(400).json({
          error: `Product ${item.productId} not found or unavailable`,
        });
      }
    }

    // Create order
    const order = {
      id: uuidv4(),
      userId,
      items: orderItems,
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    orders.push(order);

    // Simulate payment processing
    setTimeout(() => {
      const orderIndex = orders.findIndex((o) => o.id === order.id);
      if (orderIndex !== -1) {
        orders[orderIndex].status = "confirmed";
      }
    }, 2000);

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user orders
app.get("/orders/user/:userId", (req, res) => {
  const userOrders = orders.filter((o) => o.userId === req.params.userId);
  res.json(userOrders);
});

// Get order by ID
app.get("/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

// Update order status
app.patch("/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  res.json(order);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ service: "order-service", status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`📦 Order Service running on port ${PORT}`);
});
