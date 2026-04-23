const cron = require('node-cron');
const Task = require('../models/Task');
const { sendNotification } = require('./pushService');

const startScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find tasks that are pending and their date is in the past
            const upcomingTasks = await Task.find({
                done: false,
                date: { $lte: now, $ne: null }
            }).populate('user');
            
            for (const task of upcomingTasks) {
                // Limit reminders
                if (task.remindersSent < 3) {
                    const user = task.user;
                    const jwt = require('jsonwebtoken');
                    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                    const payload = {
                        title: 'Task Reminder: ' + (task.title || 'Event'),
                        body: 'Click Snooze or Dismiss.',
                        data: {
                            url: '/',
                            taskId: String(task._id),
                            taskDate: task.date.getTime(),
                            taskEndDate: task.endDate ? task.endDate.getTime() : null,
                            token: token
                        },
                        actions: [
                            { action: 'snooze', title: 'Snooze 15m' },
                            { action: 'dismiss', title: 'Dismiss' }
                        ]
                    };

                    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                        for (const sub of user.pushSubscriptions) {
                            await sendNotification(sub, payload);
                        }
                    }
                    
                    task.remindersSent += 1;
                    await task.save();
                }
            }
        } catch (error) {
            console.error('Scheduler error:', error);
        }
    });
    console.log('Task Scheduling Service Started.');
};

module.exports = startScheduler;
