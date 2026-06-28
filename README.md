# TaskFlow

TaskFlow is an AI-powered task management web application. It features a modern React frontend and a robust Node.js backend equipped with natural language processing and task scheduling capabilities.

## Features

- **AI-Powered Task Parsing:** Uses LangChain with various LLM integrations (Google GenAI, OpenAI, Groq) to parse natural language into structured tasks.
- **Secure Authentication:** OTP-based login via email using Nodemailer, with JWT for session management.
- **Push Notifications:** Web-push integration to keep users updated on their tasks.
- **Task Scheduling:** Background task scheduling using `node-cron`.
- **Modern UI:** Built with React 19, Vite, and Lucide React for a fast, responsive user experience.
- **Database:** MongoDB integration using Mongoose for reliable data storage.

## Tech Stack

### Frontend
- **Framework:** React 19, Vite
- **Routing:** React Router v7
- **Styling / Icons:** Lucide React
- **HTTP Client:** Axios
- **Date Utilities:** `date-fns`, `chrono-node`

### Backend
- **Server:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT, bcryptjs, Nodemailer (OTP via Email)
- **AI / NLP:** LangChain (`@langchain/core`, `@langchain/google-genai`, `@langchain/groq`, `@langchain/openai`)
- **Push Notifications:** `web-push`
- **Task Scheduling:** `node-cron`
- **Environment Management:** `dotenv`

## Prerequisites

- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI
- A Google App Password for sending OTP emails (if using Gmail for SMTP)
- API keys for LLM services (e.g., Groq, Gemini, or OpenAI)

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd fs
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=your_jwt_secret

# Email Configuration (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password

# AI / Langchain Configuration
GROQ_API_KEY=your_groq_api_key
# Or any other LLM provider keys you are using
```

Start the backend development server:
```bash
npm run dev
# or
node server.js
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

## Running the Application

1. Ensure MongoDB is running.
2. Start the backend server on port 5000.
3. Start the Vite frontend server.
4. Visit the local URL provided by Vite (usually `http://localhost:5173/`).

## License

ISC License
