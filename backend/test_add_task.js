const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: '60d0fe4f5311236168a109ca', email: 'test@test.com' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rawText: 'Buy milk' })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Success:", data);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
