import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, updateOrderSchema, type AttachedFile } from "@shared/schema";
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from "./services/email";
import { sendOrderNotificationToSlack } from "./services/slack";
import multer from "multer";
import path from "path";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Order management routes
  app.post("/api/orders", upload.array('files', 5), async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Handle file uploads
      const files = req.files as Express.Multer.File[];
      const attachedFiles: AttachedFile[] = files?.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      })) || [];

      const order = await storage.createOrder({
        ...orderData,
        attachedFiles,
      });

      // Send notifications
      try {
        await Promise.all([
          sendOrderConfirmationEmail(order.email, order.fullName, order.orderId),
          sendOrderNotificationEmail(process.env.ADMIN_EMAIL || 'admin@n8n-georgia.com', order),
          sendOrderNotificationToSlack(order)
        ]);
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the order creation if notifications fail
      }

      res.json({ success: true, orderId: order.orderId });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid order data' });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  app.get("/api/orders/by-order-id/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrderByOrderId(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const updates = updateOrderSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, updates);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid update data' });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
