import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const navigate = useNavigate();
    const { login } = useAuth();

    const MAX_CLIENT_ATTEMPTS = 5;

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side rate limiting
        if (attempts >= MAX_CLIENT_ATTEMPTS) {
            setError('Too many attempts. Please wait a few minutes before trying again.');
            return;
        }

        // Basic client-side validation
        if (!form.email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.login({
                email: form.email.trim().toLowerCase(),
                password: form.password,
            });

            // Reset attempts on success
            setAttempts(0);

            // Store session via AuthContext (uses sessionStorage)
            login(res.data);

            const role = res.data.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'DOCTOR') navigate('/doctor');
            else navigate('/patient');
        } catch (err) {
            setAttempts((prev) => prev + 1);
            const serverError = err.response?.data?.error;
            if (serverError) {
                setError(serverError);
            } else if (err.code === 'ECONNABORTED') {
                setError('Request timed out. Please try again.');
            } else {
                setError('Login failed. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="logo">
                    <h1><span>🏥</span> HMS</h1>
                    <p>Hospital Management System</p>
                </div>
                <h2>Sign In</h2>

                {error && (
                    <div className="alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                {attempts >= 3 && attempts < MAX_CLIENT_ATTEMPTS && (
                    <div className="alert" style={{
                        background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b',
                        padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px'
                    }}>
                        🔒 {MAX_CLIENT_ATTEMPTS - attempts} login attempt(s) remaining before temporary lockout.
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            autoComplete="email"
                            required
                            disabled={attempts >= MAX_CLIENT_ATTEMPTS}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={attempts >= MAX_CLIENT_ATTEMPTS}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '10px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', fontSize: '14px',
                                    color: '#64748b', padding: '4px'
                                }}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading || attempts >= MAX_CLIENT_ATTEMPTS}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="auth-link">
                    Don't have an account? <Link to="/register">Sign Up</Link>
                </div>
                <div style={{
                    marginTop: '16px', padding: '10px 12px', background: '#f1f5f9',
                    borderRadius: '8px', fontSize: '11px', color: '#64748b', lineHeight: '1.5'
                }}>
                    🔒 <strong>Session Security:</strong> Your session is stored securely and
                    will expire automatically. Closing the browser tab will end your session.
                </div>
                <div style={{
                    marginTop: '10px', padding: '12px', background: '#f1f5f9',
                    borderRadius: '8px', fontSize: '12px', color: '#64748b'
                }}>
                    <strong>Demo Credentials:</strong><br />
                    Admin: admin@hms.com / Admin@123<br />
                    Doctor: rajesh@hms.com / Doctor@123<br />
                    Patient: patient@hms.com / Patient@123
                </div>
            </div>
        </div>
    );
};

export default Login;
