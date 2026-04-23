import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Key, ArrowRight } from 'lucide-react';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/login', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/verify', { email, otp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel animate-entrance" style={{ padding: '3rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h2 className="text-gradient" style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>TaskFlow</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Premium task management.</p>
        
        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)' }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ paddingLeft: '48px' }} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Request OTP'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Key style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                required 
                maxLength={6}
                style={{ paddingLeft: '48px', letterSpacing: '4px', textAlign: 'center' }} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'} <ArrowRight size={18} />
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ marginTop: '0.5rem' }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
