import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const drawingElements = pgTable("drawing_elements", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  elementId: text("element_id").notNull(),
  type: text("type").notNull(), // rectangle, diamond, ellipse, arrow, line, draw, text, image
  data: jsonb("data").notNull(), // element properties and geometry
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const drawingSessions = pgTable("drawing_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(), // canvas state, zoom, pan, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDrawingElementSchema = createInsertSchema(drawingElements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDrawingSessionSchema = createInsertSchema(drawingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDrawingElement = z.infer<typeof insertDrawingElementSchema>;
export type DrawingElement = typeof drawingElements.$inferSelect;
export type InsertDrawingSession = z.infer<typeof insertDrawingSessionSchema>;
export type DrawingSession = typeof drawingSessions.$inferSelect;

// Frontend-only types for the drawing application
export interface Point {
  x: number;
  y: number;
}

export interface DrawingElementData {
  id: string;
  type: 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'draw' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
  text?: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  seed?: number; // for rough.js consistency
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  theme: 'light' | 'dark';
}
