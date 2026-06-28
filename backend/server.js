const express = require('express');
require('dotenv').config({ override: true });


const cors = require('cors');
const connectDB = require('./config/db');

const authRoute = require('./routes/authRoute');
const taskRoute = require('./routes/taskRoute');
const pushRoute = require('./routes/pushRoute');
const agentRoute = require('./routes/agentRoute');
const startScheduler = require('./services/scheduler');
connectDB();
startScheduler();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/tasks', taskRoute);
app.use('/api/push', pushRoute);
app.use('/api/agent', agentRoute);

app.get('/api', (req, res) => {
  res.json({ status: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
