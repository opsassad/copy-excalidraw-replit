# Excalidraw Clone

## Overview

This is a full-stack Excalidraw clone that provides a hand-drawn style whiteboard application for creating diagrams, sketches, and collaborative drawings. The application features an infinite canvas with real-time drawing capabilities, supporting various shapes, tools, and export options.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Canvas Rendering**: HTML5 Canvas with Rough.js for hand-drawn aesthetics

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful API design
- **Storage**: In-memory storage with interface for database integration
- **Session Management**: File-based session handling

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with Zod for schema validation
- **Current Storage**: In-memory storage (MemStorage) for development
- **Database Provider**: Neon Database (serverless PostgreSQL)

## Key Components

### Drawing Engine
- **Canvas Management**: Custom canvas component with zoom, pan, and infinite scroll
- **Rendering**: Rough.js integration for hand-drawn aesthetic
- **Element Types**: Rectangle, diamond, ellipse, arrow, line, freehand draw, text, image
- **Tool System**: Comprehensive tool selection with keyboard shortcuts

### User Interface
- **Main Toolbar**: Tool selection, undo/redo functionality
- **Secondary Toolbar**: Theme toggle, export options, help
- **Property Panel**: Element styling and canvas settings
- **Zoom Controls**: Zoom in/out, reset, fit to screen
- **Keyboard Shortcuts**: Complete hotkey system for power users

### Collaboration Features
- **Session Management**: URL-based session sharing
- **Real-time Sync**: Prepared for WebSocket integration
- **Element Synchronization**: CRUD operations for drawing elements

## Data Flow

1. **User Interaction**: Mouse/touch events captured on canvas
2. **Tool Processing**: Selected tool determines element creation/modification
3. **Local State Update**: React state updated immediately for responsiveness
4. **Server Sync**: API calls to persist changes to backend
5. **Canvas Rendering**: Elements rendered using Rough.js on HTML5 canvas

### API Endpoints
- `POST /api/elements` - Create new drawing element
- `PUT /api/elements/:elementId` - Update existing element
- `DELETE /api/elements/:elementId` - Delete element
- `GET /api/sessions/:sessionId/elements` - Fetch session elements
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:sessionId` - Get session data

## External Dependencies

### Frontend Libraries
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Icons**: Lucide React icon library
- **Fonts**: Inter, Kalam, JetBrains Mono via Google Fonts
- **Canvas**: Rough.js for hand-drawn style rendering
- **Forms**: React Hook Form with Zod validation

### Backend Libraries
- **Database**: Drizzle ORM with PostgreSQL driver
- **Validation**: Zod for runtime type checking
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Bundling**: Vite with React plugin
- **Linting**: TypeScript compiler for type checking
- **Replit Integration**: Cartographer plugin for development environment

## Deployment Strategy

### Development
- **Server**: tsx for hot-reloading TypeScript execution
- **Client**: Vite dev server with HMR
- **Database**: Environment-based PostgreSQL connection

### Production
- **Build Process**: 
  1. Vite builds client assets to `dist/public`
  2. esbuild bundles server code to `dist/index.js`
- **Serving**: Express serves static files and API routes
- **Database**: Production PostgreSQL via DATABASE_URL environment variable

### Environment Configuration
- **Development**: NODE_ENV=development with Vite middleware
- **Production**: NODE_ENV=production with static file serving
- **Database**: Drizzle migrations via `npm run db:push`

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```