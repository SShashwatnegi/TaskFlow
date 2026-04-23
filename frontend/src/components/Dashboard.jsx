import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CheckCircle, Circle, LogOut, Plus, Search, Calendar, Activity } from 'lucide-react';

const Dashboard = ({ setIsAuthenticated }) => {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tasks', { rawText: newTaskText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewTaskText('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="container animate-entrance">
      <header className="flex-between" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity className="text-gradient" size={28} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>TaskFlow</h1>
        </div>
        <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={22} color="var(--accent-primary)" />
            {pendingCount === 0 ? "You're all caught up!" : `You have ${pendingCount} pending task${pendingCount === 1 ? '' : 's'}`}
        </h2>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="E.g., Remind me to call John tomorrow at 5pm..." 
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            style={{ flex: 1, paddingLeft: '20px' }}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Plus size={20} /> Add
          </button>
        </form>
      </div>

      <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.map(task => (
          <div key={task._id} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', opacity: task.status === 'completed' ? 0.6 : 1, transition: 'var(--transition)' }}>
            <button 
                onClick={() => toggleTaskStatus(task._id, task.status)}
                style={{ background: 'transparent', border: 'none', padding: 0, marginRight: '1rem' }}
            >
                {task.status === 'completed' ? <CheckCircle size={28} color="var(--success)" /> : <Circle size={28} color="var(--text-muted)" />}
            </button>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1.1rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)', marginBottom: '4px' }}>
                    {task.rawText}
                </p>
                {task.parsedDate && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-hover)' }}>
                        <Calendar size={14} /> {format(new Date(task.parsedDate), 'PPpp')}
                    </p>
                )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No tasks found. Create one above to get started.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
