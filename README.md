🚀 TaskFlow & Smart Scheduler

🌟 1. Project Overview & Functionality
What is this project?
TaskFlow is an Intelligent Task Management System built entirely using the MERN Stack (MongoDB, Express, React, Node.js). It seamlessly connects a Web application with a unified Chrome Extension, enabling users to manage their schedule, add tasks using natural language, and receive background push notifications.

Core Functionalities to Highlight:
Natural Language Processing (NLP): The application understands human language. If a user types "Meeting tomorrow at 6pm for 2 hours", the system automatically figures out the correct start and end times in the database! It uses a library called chrono-node to accomplish this.
Real-time Push Notifications: The system runs a background cron job (like a clock ticking every minute) that checks the database for overdue tasks. If tasks are due, it sends a web-push notification to the user's browser, even if they aren't actively looking at the tab.
Cross-Platform Sync: The User has a standalone Chrome Extension that shares the same authentication and database, meaning they can quick-capture tasks from anywhere on the web via a small popup overlay.
OTP Security: Instead of traditional passwords, the system uses OTP (One Time Password) combined with JSON Web Tokens (JWT) for a modern, secure, passwordless authentication flow.
📁 2. Folder and File Breakdown
You can walk the evaluator through your codebase using the following structure.

🌍 frontend/
This is your React + Vite application. It provides the premium UI the user interacts with.

src/components/SchedulerComponents.jsx: (Crucial File) This handles the visual Calendar (MiniCal, MonthView, WeekView), Natural Language Input processing, and Notification Bell UI. This file dictates how users interact with their days visually.
src/components/Dashboard.jsx: The main post-login layout container that orchestrates fetching tasks and passing them down to the SchedulerComponents.
src/components/Login.jsx & AuthPage.jsx: The components handling the user-facing side of the OTP-based authentication system.
src/utils/helpers.js: Centralized javascript logic for formatting dates, handling categories/priorities, and parsing NLP output securely.
src/App.jsx & main.jsx: The foundational React entry points that wrap the entire application in context mapping, styles (index.css), and routing.
⚙️ backend/
This is the Node.js / Express.js server responsible for database operations and business logic.

models/: Defines our MongoDB data structures wrapper using Mongoose.
User.js: Stores user email, OTP code logic, and the pushSubscriptions arrays for background notifications.
Task.js: Stores individual tasks, referencing the User who created it, the parsed NLP start/end dates, priorities, and categories.
routes/: Handles incoming frontend HTTP requests.
authRoute.js: Processes OTP generation and token verification when a user logs in.
taskRoute.js: The CRUD (Create, Read, Update, Delete) controller.
pushRoute.js: An endpoint where clients explicitly opt-in to receiving notifications by sending their Vapid Keys.
services/ & middleware/:
scheduler.js: (Crucial File) Uses node-cron to spin every single minute, query MongoDB using $lte: new Date() to find overlapping tasks, and triggers dispatch.
pushService.js: Wraps web-push payloads to ensure the notifications are securely encrypted and dispatched to the browser's Service Worker.
authMiddleware.js: Intercepts API requests to verify the JWT token is valid before letting users access private APIs.
server.js: The central Express bootstrap file that wires together all routes, databases, and middleware seamlessly.
config/db.js: Contains the logic to manage connection variables for MongoDB.
🧩 extension/
Your custom Chrome Extension ensuring quick capture.

manifest.json: The core settings file Chrome needs to understand what permissions and scripts to run (Uses Manifest V3 architecture).
popup.html & popup.js: The UI and logic script when the user clicks the extension icon. It intercepts ss_token (JWT token) located in Chrome's Background Extension Storage to securely inject fast notes straight into the backend's taskRoute.
🗄️ 3. Database Schema
Be ready to explain how your data relates.

User Collection (User.js):
email: Distinct identifier.
otp / otpExpiry: Temporary, rotating passwords securing the account without long-term hashes.
pushSubscriptions: A neat array storing every client device the user logs in with so they can be notified everywhere simultaneously.
Task Collection (Task.js):
user: Links strictly to the User schema ensuring data privacy constraints.
title, date, endDate: Dates are heavily used throughout indexing and comparisons natively by MongoDB.
category, priority: Strings used by UI to generate contextual pill-colors.
remindersSent: An integrity counter checking to make sure over-due Cron Notifications max out at 3 so we don't spam users.
