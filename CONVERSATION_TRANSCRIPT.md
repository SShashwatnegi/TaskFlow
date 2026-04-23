# TaskFlow Architecture Walkthrough (Conversation Transcript)

## 1. `server.js` (The Application Heart)

When Node.js starts your backend, it reads this file from top to bottom. It acts as the switchboard connecting all the separate pieces of your app together. 

Here is what it does line-by-line:

**1. Importing Tools:**
```javascript
const express = require('express'); 
const dotenv = require('dotenv');
const cors = require('cors');
```
* `express`: The main web framework that allows us to create an API easily.
* `dotenv`: A tool that reads the `.env` file (where your secrets like `EMAIL_PASS` live) and loads them securely into Node.js.
* `cors`: Cross-Origin Resource Sharing. Because your frontend runs on Port 5173 and backend on Port 5000, browsers normally block them from talking to each other for security. `cors` throws the door open and says, "It's okay, let them talk!"

**2. Importing Your Custom Code:**
```javascript
const connectDB = require('./config/db');
const authRoute = require('./routes/authRoute');
const taskRoute = require('./routes/taskRoute');
// ... etc
```
Instead of writing 5,000 lines of code in a single file, you split everything into separate folders. This section simply imports your database connection and your web routes.

**3. Starting up crucial services:**
```javascript
dotenv.config(); // Reads your .env file
connectDB(); // Reaches out and connects to MongoDB using your connect string
startScheduler(); // Starts the background corn-job that checks for overdue tasks to push notify!
```

**4. Building the API:**
```javascript
const app = express();
app.use(express.json()); 
```
* `app = express()`: This creates the actual server instance.
* `app.use(express.json())`: This tells the server, "If the React frontend sends us data (like an email and OTP), automatically parse it as JSON so we can read it."

**5. Routing Traffic:**
```javascript
app.use('/api/auth', authRoute);
app.use('/api/tasks', taskRoute);
```
This is the switchboard! It tells the server: "If the frontend makes a request to `http://localhost:5000/api/auth/login`, don't handle it here—forward it to the `authRoute` file and let that file deal with it!" 

**6. Turning on the Engine:**
```javascript
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```
This physically opens Port 5000 on your computer and sits in an infinite loop, constantly listening for incoming network requests from the frontend or Chrome extension.

---

## 2. `config/db.js` (The Database Bridge)

This file has one sole purpose: to securely connect your backend server to your MongoDB database. Let's break it down line-by-line:

**1. Importing Mongoose**
```javascript
const mongoose = require('mongoose');
```
* **Mongoose** is an incredibly powerful library that acts as a translator between Node.js and MongoDB. Instead of writing raw, messy database queries, Mongoose lets you interact with the database using simple JavaScript objects.

**2. The Asynchronous Function**
```javascript
const connectDB = async () => { ... }
```
* Connecting to a database over a network takes time. The `async` keyword tells JavaScript: *"Hey, this function takes time. Do not freeze the whole server while waiting for the database to reply!"* 

**3. The Try-Catch Block & Connection String**
```javascript
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow';
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
```
* **`try { ... } catch()`**: Because network connections can fail, we wrap it in a `try` block safely. 
* **`const uri`**: It first tries to find a `MONGO_URI` link in your secret `.env` file. If it can't find one, the `||` operator forces it to fallback to a local database on your computer (`127.0.0.1`).
* **`await`**: Tells the server to pause exactly on this line until MongoDB says "Yes, I am connected!".

**4. Handling Catastrophic Errors**
```javascript
    } catch (error) {
        process.exit(1);
    }
```
* **`process.exit(1)`**: This is a direct kill switch! It tells Node.js: *"If we can't connect to the database, shut down the entire server immediately."*

### What is the role of a database?
Think of your Node.js backend as the **"Brain"** of your application. If it goes to sleep (restarts or crashes), it forgets everything it was holding in its short-term memory! The **Database** acts as the **"Hard Drive" or "Filing Cabinet"** with its sole job being **Permanent Storage**. 

### Where can you view your database?
Because your `db.js` file uses the connection string `mongodb://127.0.0.1:27017/taskflow`, your database is running **100% locally on your computer**. You can download a free visual program called **MongoDB Compass**, paste that link in, and visually look at your Users and Tasks spreadsheets!

---

## 3. `models/` (The Data Bouncers)

If the database is a filing cabinet, the files in the `models/` folder act as the **"Bouncers"** or **"Templates"**. 
MongoDB is naturally "schema-less," meaning it will happily let you save *anything* to it. The models use Mongoose to enforce strict rules on exactly how data must be structured before it is allowed into the database.

**1. Relational Mapping (The `user` field in Task.js)**
```javascript
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
```
* **`type: ObjectId`**: This tells the system, "Store the unique ID of the User who created this." Let's Mongoose pull the full User profile alongside the task later.
* **`required: true`**: A task *cannot* be saved unless it is attached to a user account. 

**2. Standard Data Types & Rules**
```javascript
    title: { type: String, required: true }, // Bouncer: Title cannot be empty
    date: { type: Date, required: true }, // Validates that it is an actual timestamp!
    priority: { type: String, default: 'medium' }, // Bouncer fills it in if empty
```

**3. Timestamps**
* Adding `{ timestamps: true }` makes MongoDB automatically generate `createdAt` and `updatedAt` records for you invisibly!

---

## 4. `routes/` (The API Doors)

Routes act as the **Doors** to your application. When React wants to talk to the backend, it sends an HTTP request to one of these doors. 

**1. The Imports and Protection (`taskRoute.js`)**
```javascript
const express = require('express');
const chrono = require('chrono-node');
const authMiddleware = require('../middleware/authMiddleware');
```
* The `authMiddleware` acts as a security system checking your JWT Token. If a hacker tries to hit the `/api/tasks` door *without* a valid token, the middleware bounces them out immediately!

**2. Reading Data (GET)**
```javascript
router.get('/', authMiddleware, async (req, res) => {
    const tasks = await Task.find({ user: req.user.id });
});
```
* The backend queries MongoDB: *"Find all tasks where the `user` ID matches the logged-in person."* This ensures you can't view my tasks, and I can't view yours!

**3. Creating Data (POST) & The "Smart" AI Feature**
* If someone uses your Chrome Extension, they just type *"Review code at 6pm"*. Because the extension doesn't have a calendar UI, the backend takes that raw text and uses **`chrono-node`** (a Natural Language Processing library) to magically calculate exactly what time "6pm" is today, turning it into a real Date object before saving it to our `Task` model!

*(Side note: `authRoute.js` works identically, taking your email, hashing your OTP with bcrypt, and emailing it using Nodemailer!)*

---

## 5. `middleware/` (The Security Checkpoint)

In Express.js, a "Middleware" is like a security guard standing in the hallway *between* the front door (the Request) and the database bank vault (your Route). 

**1. Intercepting the Request**
```javascript
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
```
* The guard intercepts requests and checks for an **`Authorization`** JWT token header. 

**2. Verifying the Token Cryptography**
```javascript
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = verified;
        next();
```
* It uses `JWT_SECRET` to mathematically verify the token wasn't forged. 
* **`next()`**: This is the magic word! It means, "You pass the security check. Open the door and proceed to the actual Route code."

---

## 6. `services/` (The Background Alarms)

Services handle the heavy-lifting logic that runs quietly in the background. 

**1. `pushService.js` (The Notification Post Office)**
Web Push notifications are highly regulated by browsers (like Chrome) to prevent spam. You need cryptographic keys called **VAPID Keys** to prove you are a legitimate server so Windows/Mac will show the notification. 

**2. `scheduler.js` (The Alarm Clock)**
```javascript
const cron = require('node-cron');
cron.schedule('* * * * *', async () => { ... }
```
* **`* * * * *`**: A Unix cron expression meaning *"Run this function exactly once every single minute, forever"* 
* Every 60 seconds, it asks MongoDB for overdue tasks: `done: false`, and `date <= RIGHT NOW`.
* It then uses `pushService.js` to dispatch the popup. A `remindersSent < 3` check caps it at 3 alerts so users don't get angry and uninstall your app!

---

## 7. The Frontend 

The Frontend acts as the face—it's everything you can see, click, and interact with on the screen. 

**1. `index.html` (The Blank Canvas)**
It contains a nearly empty `<div id="root"></div>` box. React uses this box as an anchor to magically "paint" your entire dashboard inside of it. 

**2. `src/main.jsx` (The React Painter)**
It forcefully injects `App.jsx` into the empty box, making your website visible. It also tells Chrome to run `service-worker.js` in the background.

**3. `public/service-worker.js`**
This script installs deep inside your browser and **stays awake in the background**, even if your website is closed. It listens infinitely for a `push` event incoming from your Node.js backend. When it hears the alarm, it fires `self.registration.showNotification()` to slide a notification box onto the bottom-right of your screen!

**4. `src/App.jsx`**
This massive 650-line file contains everything:
* **NLP Engine (`parseNLP`)**: Parses text clientside to render live task previews ("Meeting at 5pm" turns into a 5:00 calendar block).
* **Login Zone (`<AuthPage />`)**: Fires requests via `axios` to get the OTP, and saves the JWT token into `localStorage`.
* **The Giant Calendar Engine**: Calculates exactly how many days are in the month, generating a CSS grid, and mapping over the downloaded tasks to place colored `<Pill />` blocks on the screen exactly where they belong.

---

## 8. The Chrome Extension

This natively injects into Google Chrome using three simple files:

**1. `manifest.json` (The Chrome Passport)**
Contains metadata. Configures `action.default_popup` to instruct Chrome to render the dropdown menu when you click the toolbar icon. Also asks Chrome for `permissions: ["storage"]` so it can remember your login.

**2. `popup.html`**
A tiny, bare-bones UI window built with standard HTML.

**3. `popup.js` (The Bridge)**
When you type your raw text and hit Add, it uses the local JWT token and executes an HTTP `fetch()` request directly to your `localhost:5000/api/tasks` backend. Once the backend translates the NLP timeframe and saves it into MongoDB, the extension paints the text green ("Task added successfully!").
