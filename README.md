# Postman Clone

A full-stack functional clone of the Postman API client, featuring a React/Next.js frontend and a FastAPI/SQLite backend.

## Architecture Overview

### Frontend
- **Framework**: Next.js 14 with App Router (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **API Client**: Axios

The frontend replicates the core Postman workspace. It maintains local state for open requests (tabs), sidebar collections, and history. State management is handled through `zustand`, syncing with the backend API.

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **HTTP Client**: `httpx` (for proxying requests)

The backend serves two primary purposes:
1. **Persistence API**: Stores and retrieves collections, saved requests, environments, and history.
2. **Proxy Runner**: Receives request parameters from the frontend and executes actual HTTP requests from the server to bypass browser CORS limitations, then returns the raw response.

## Database Schema (SQLite)
- `collections`: Groups saved requests.
- `saved_requests`: Stores request details (method, URL, headers, body, auth).
- `environments` and `environment_variables`: Manages variables (e.g. `{{base_url}}`).
- `history`: Logs all executed proxy requests along with response metrics.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. Seed the database with sample data (optional):
   Open `http://localhost:8000/seed` in your browser.

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
4. Open the application at [http://localhost:3000](http://localhost:3000).

## Core Features Implemented
- Workspace Layout with resizable panels (Postman look-and-feel).
- Collections CRUD and History tracking.
- Full HTTP Request Builder (Method, URL, Headers, Query Params, Raw Body, Auth).
- Real HTTP Request Execution via Backend Proxy (Bypasses CORS).
- Response Viewer (Status Code, Time, Size, Pretty JSON formatting, Response Headers).

## Assumptions
- No actual user authentication is required (single-user application mode).
- The backend runs on `localhost:8000` and the frontend proxy requests assume this base URL.
