import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'PATIENT',
        specialization: '',
        department: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        const pwd = form.password;
        if (!pwd) return { score: 0, label: '', color: '' };

        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 8) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

        if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
        if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
        return { score, label: 'Strong', color: '#22c55e' };
    }, [form.password]);

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
        // Clear specific field error
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: '' });
        }
        if (error) setError('');
    };

    // Client-side validation
    const validate = () => {
        const errors = {};

        if (!form.name.trim() || form.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (form.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        } else if (!/[a-z]/.test(form.password)) {
            errors.password = 'Password must contain at least one lowercase letter';
        } else if (!/[A-Z]/.test(form.password)) {
            errors.password = 'Password must contain at least one uppercase letter';
        } else if (!/\d/.test(form.password)) {
            errors.password = 'Password must contain at least one digit';
        }

        if (form.password !== form.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }

        if (form.role === 'DOCTOR') {
            if (!form.specialization.trim()) errors.specialization = 'Specialization is required for doctors';
            if (!form.department.trim()) errors.department = 'Department is required for doctors';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                role: form.role,
                specialization: form.specialization.trim() || null,
                department: form.department.trim() || null,
                phone: form.phone.trim() || null,
            };

            const res = await authAPI.register(payload);

            // Store session via AuthContext (uses sessionStorage)
            login(res.data);

            const role = res.data.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'DOCTOR') navigate('/doctor');
            else navigate('/patient');
        } catch (err) {
            if (err.response?.data?.validationErrors) {
                setFieldErrors(err.response.data.validationErrors);
            }
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderFieldError = (field) => {
        if (!fieldErrors[field]) return null;
        return <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            {fieldErrors[field]}
        </span>;
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="logo">
                    <h1><span>🏥</span> HMS</h1>
                    <p>Hospital Management System</p>
                </div>
                <h2>Create Account</h2>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            type="text"
                            className={`form-control ${fieldErrors.name ? 'input-error' : ''}`}
                            placeholder="Enter your full name"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            autoComplete="name"
                            required
                            maxLength={100}
                        />
                        {renderFieldError('name')}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            type="email"
                            className={`form-control ${fieldErrors.email ? 'input-error' : ''}`}
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            autoComplete="email"
                            required
                        />
                        {renderFieldError('email')}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control ${fieldErrors.password ? 'input-error' : ''}`}
                                placeholder="Create a strong password"
                                value={form.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                autoComplete="new-password"
                                required
                                maxLength={128}
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
                        {form.password && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{
                                    display: 'flex', gap: '4px', marginBottom: '4px'
                                }}>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} style={{
                                            flex: 1, height: '4px', borderRadius: '2px',
                                            background: i <= passwordStrength.score ? passwordStrength.color : '#e2e8f0',
                                            transition: 'background 0.3s ease'
                                        }} />
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: '11px', color: passwordStrength.color, fontWeight: '600'
                                }}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                        {renderFieldError('password')}
                        <div style={{
                            fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4'
                        }}>
                            Must contain: uppercase, lowercase, and a digit (min 6 chars)
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm-password">Confirm Password</label>
                        <input
                            id="reg-confirm-password"
                            type="password"
                            className={`form-control ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Confirm your password"
                            value={form.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        {renderFieldError('confirmPassword')}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-role">Role</label>
                        <select
                            id="reg-role"
                            className="form-control"
                            value={form.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                        >
                            <option value="PATIENT">Patient</option>
                            <option value="DOCTOR">Doctor</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-phone">Phone</label>
                        <input
                            id="reg-phone"
                            type="tel"
                            className={`form-control ${fieldErrors.phone ? 'input-error' : ''}`}
                            placeholder="Enter 10-digit phone number"
                            value={form.phone}
                            onChange={(e) => {
                                // Only allow digits
                                const digits = e.target.value.replace(/\D/g, '');
                                handleChange('phone', digits.slice(0, 10));
                            }}
                            autoComplete="tel"
                            maxLength={10}
                        />
                        {renderFieldError('phone')}
                    </div>

                    {form.role === 'DOCTOR' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="reg-specialization">Specialization</label>
                                <input
                                    id="reg-specialization"
                                    type="text"
                                    className={`form-control ${fieldErrors.specialization ? 'input-error' : ''}`}
                                    placeholder="e.g. Cardiologist, Neurologist"
                                    value={form.specialization}
                                    onChange={(e) => handleChange('specialization', e.target.value)}
                                    required
                                />
                                {renderFieldError('specialization')}
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-department">Department</label>
                                <input
                                    id="reg-department"
                                    type="text"
                                    className={`form-control ${fieldErrors.department ? 'input-error' : ''}`}
                                    placeholder="e.g. Cardiology, Neurology"
                                    value={form.department}
                                    onChange={(e) => handleChange('department', e.target.value)}
                                    required
                                />
                                {renderFieldError('department')}
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-link">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>

                <div style={{
                    marginTop: '16px', padding: '10px 12px', background: '#f1f5f9',
                    borderRadius: '8px', fontSize: '11px', color: '#64748b', lineHeight: '1.5'
                }}>
                    🔒 <strong>Security:</strong> Your password is encrypted before storage.
                    Session data is stored securely and clears when you close the browser tab.
                </div>
            </div>
        </div>
    );
};

export default Register;
