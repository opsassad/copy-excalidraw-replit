import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDrawingElementSchema, insertDrawingSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Drawing elements routes
  app.post("/api/elements", async (req, res) => {
    try {
      const element = insertDrawingElementSchema.parse(req.body);
      const created = await storage.createElement(element);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid element data", error });
    }
  });

  app.put("/api/elements/:elementId", async (req, res) => {
    try {
      const { elementId } = req.params;
      const { sessionId, data } = req.body;
      
      if (!sessionId || !data) {
        return res.status(400).json({ message: "sessionId and data are required" });
      }

      const updated = await storage.updateElement(elementId, sessionId, data);
      if (!updated) {
        return res.status(404).json({ message: "Element not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update element", error });
    }
  });

  app.delete("/api/elements/:elementId", async (req, res) => {
    try {
      const { elementId } = req.params;
      const { sessionId } = req.query;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: "sessionId is required" });
      }

      const deleted = await storage.deleteElement(elementId, sessionId);
      if (!deleted) {
        return res.status(404).json({ message: "Element not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete element", error });
    }
  });

  app.get("/api/sessions/:sessionId/elements", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const elements = await storage.getElementsBySession(sessionId);
      res.json(elements);
    } catch (error) {
      res.status(400).json({ message: "Failed to get elements", error });
    }
  });

  // Drawing sessions routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const session = insertDrawingSessionSchema.parse(req.body);
      const created = await storage.createSession(session);
      res.json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data", error });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to get session", error });
    }
  });

  app.put("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { data } = req.body;
      
      if (!data) {
        return res.status(400).json({ message: "data is required" });
      }

      const updated = await storage.updateSession(sessionId, data);
      if (!updated) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update session", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
