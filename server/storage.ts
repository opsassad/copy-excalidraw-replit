import { drawingElements, drawingSessions, type DrawingElement, type InsertDrawingElement, type DrawingSession, type InsertDrawingSession } from "@shared/schema";

export interface IStorage {
  // Drawing elements
  createElement(element: InsertDrawingElement): Promise<DrawingElement>;
  updateElement(elementId: string, sessionId: string, data: any): Promise<DrawingElement | undefined>;
  deleteElement(elementId: string, sessionId: string): Promise<boolean>;
  getElementsBySession(sessionId: string): Promise<DrawingElement[]>;
  
  // Drawing sessions
  createSession(session: InsertDrawingSession): Promise<DrawingSession>;
  getSession(sessionId: string): Promise<DrawingSession | undefined>;
  updateSession(sessionId: string, data: any): Promise<DrawingSession | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private elements: Map<string, DrawingElement>;
  private sessions: Map<string, DrawingSession>;
  private currentElementId: number;
  private currentSessionId: number;

  constructor() {
    this.elements = new Map();
    this.sessions = new Map();
    this.currentElementId = 1;
    this.currentSessionId = 1;
  }

  async createElement(insertElement: InsertDrawingElement): Promise<DrawingElement> {
    const id = this.currentElementId++;
    const element: DrawingElement = {
      ...insertElement,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const key = `${element.sessionId}_${element.elementId}`;
    this.elements.set(key, element);
    return element;
  }

  async updateElement(elementId: string, sessionId: string, data: any): Promise<DrawingElement | undefined> {
    const key = `${sessionId}_${elementId}`;
    const element = this.elements.get(key);
    if (!element) return undefined;
    
    const updatedElement: DrawingElement = {
      ...element,
      data,
      updatedAt: new Date(),
    };
    this.elements.set(key, updatedElement);
    return updatedElement;
  }

  async deleteElement(elementId: string, sessionId: string): Promise<boolean> {
    const key = `${sessionId}_${elementId}`;
    return this.elements.delete(key);
  }

  async getElementsBySession(sessionId: string): Promise<DrawingElement[]> {
    return Array.from(this.elements.values()).filter(
      (element) => element.sessionId === sessionId
    );
  }

  async createSession(insertSession: InsertDrawingSession): Promise<DrawingSession> {
    const id = this.currentSessionId++;
    const session: DrawingSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<DrawingSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId: string, data: any): Promise<DrawingSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession: DrawingSession = {
      ...session,
      data,
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    // Also delete all elements in this session
    const elementsToDelete = Array.from(this.elements.keys()).filter(
      key => key.startsWith(`${sessionId}_`)
    );
    elementsToDelete.forEach(key => this.elements.delete(key));
    
    return this.sessions.delete(sessionId);
  }
}

export const storage = new MemStorage();
