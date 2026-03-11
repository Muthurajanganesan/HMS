import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('schedule');
    const [appointments, setAppointments] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Add slot form
    const [slotForm, setSlotForm] = useState({
        date: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        loadAppointments();
        loadSlots();
    }, []);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const res = await doctorAPI.getAppointments();
            setAppointments(res.data);
        } catch (err) {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async () => {
        try {
            const res = await doctorAPI.getSlots();
            setSlots(res.data);
        } catch (err) {
            console.error('Failed to load slots');
        }
    };

    const handleConfirm = async (id) => {
        try {
            await doctorAPI.confirmAppointment(id);
            setSuccess('Appointment confirmed!');
            loadAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to confirm');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleComplete = async (id) => {
        try {
            await doctorAPI.completeAppointment(id);
            setSuccess('Appointment marked as completed!');
            loadAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await doctorAPI.addSlot({
                date: slotForm.date,
                startTime: slotForm.startTime + ':00',
                endTime: slotForm.endTime + ':00',
            });
            setSuccess('Slot added successfully!');
            setSlotForm({ date: '', startTime: '', endTime: '' });
            loadSlots();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add slot');
        }
    };

    const handleFilterByDate = async () => {
        if (!filterDate) {
            loadAppointments();
            return;
        }
        setLoading(true);
        try {
            const res = await doctorAPI.getAppointmentsByDate(filterDate);
            setAppointments(res.data);
        } catch (err) {
            setError('Failed to filter');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusBadge = (status) => {
        const map = {
            BOOKED: 'badge-booked',
            CONFIRMED: 'badge-confirmed',
            COMPLETED: 'badge-completed',
            CANCELLED: 'badge-cancelled',
        };
        return <span className={`badge ${map[status]}`}>{status}</span>;
    };

    // Stats
    const totalAppointments = appointments.length;
    const bookedCount = appointments.filter((a) => a.status === 'BOOKED').length;
    const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="navbar-left">
                    <div className="navbar-logo"><span>🏥</span> HMS</div>
                </div>
                <div className="navbar-right">
                    <div className="user-badge">
                        👨‍⚕️ {user?.name}
                        <span className="role-tag">Doctor</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="page-wrapper">
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <h2><span>👨‍⚕️</span> Doctor Portal</h2>
                    </div>
                    <ul className="sidebar-nav">
                        <li>
                            <a
                                href="#schedule"
                                className={activeTab === 'schedule' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('schedule'); }}
                            >
                                <span className="nav-icon">📅</span> My Schedule
                            </a>
                        </li>
                        <li>
                            <a
                                href="#slots"
                                className={activeTab === 'slots' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('slots'); }}
                            >
                                <span className="nav-icon">🕐</span> Manage Availability
                            </a>
                        </li>
                    </ul>
                    <ul className="sidebar-nav" style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                        <li>
                            <button onClick={handleLogout}>
                                <span className="nav-icon">🚪</span> Logout
                            </button>
                        </li>
                    </ul>
                </aside>

                <main className="main-content">
                    {success && <div className="alert alert-success">✅ {success}</div>}
                    {error && <div className="alert alert-error">⚠️ {error}</div>}

                    {activeTab === 'schedule' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>My Schedule</h2>
                                    <p>View and manage your appointments</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="card-grid" style={{ marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon blue">📋</div>
                                    <div className="stat-info">
                                        <h4>{totalAppointments}</h4>
                                        <p>Total Appointments</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan">🔔</div>
                                    <div className="stat-info">
                                        <h4>{bookedCount}</h4>
                                        <p>Pending (Booked)</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon blue">✅</div>
                                    <div className="stat-info">
                                        <h4>{confirmedCount}</h4>
                                        <p>Confirmed</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green">🎯</div>
                                    <div className="stat-info">
                                        <h4>{completedCount}</h4>
                                        <p>Completed</p>
                                    </div>
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="search-bar">
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ maxWidth: '200px' }}
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={handleFilterByDate}>Filter</button>
                                <button className="btn btn-outline" onClick={() => { setFilterDate(''); loadAppointments(); }}>
                                    Clear
                                </button>
                            </div>

                            {loading ? (
                                <div className="loading"><div className="spinner"></div> Loading...</div>
                            ) : appointments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📅</div>
                                    <p>No appointments found</p>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Patient</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                    <th>Fee</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {appointments.map((apt) => (
                                                    <tr key={apt.id}>
                                                        <td><strong>{apt.patientName}</strong></td>
                                                        <td>{apt.appointmentDate}</td>
                                                        <td>{apt.startTime} - {apt.endTime}</td>
                                                        <td>{getStatusBadge(apt.status)}</td>
                                                        <td>₹{apt.fee || 500}</td>
                                                        <td>
                                                            <div className="btn-group">
                                                                {apt.status === 'BOOKED' && (
                                                                    <button className="btn btn-success btn-sm" onClick={() => handleConfirm(apt.id)}>
                                                                        Confirm
                                                                    </button>
                                                                )}
                                                                {apt.status === 'CONFIRMED' && (
                                                                    <button className="btn btn-primary btn-sm" onClick={() => handleComplete(apt.id)}>
                                                                        Complete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'slots' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>Manage Availability</h2>
                                    <p>Add or remove your available time slots</p>
                                </div>
                            </div>

                            {/* Add Slot Form */}
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div className="card-header">
                                    <h3>Add New Slot</h3>
                                </div>
                                <form onSubmit={handleAddSlot}>
                                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                        <div className="form-group">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={slotForm.date}
                                                onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Start Time</label>
                                            <input
                                                type="time"
                                                className="form-control"
                                                value={slotForm.startTime}
                                                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Time</label>
                                            <input
                                                type="time"
                                                className="form-control"
                                                value={slotForm.endTime}
                                                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary">+ Add Slot</button>
                                </form>
                            </div>

                            {/* Current Slots */}
                            <div className="card">
                                <div className="card-header">
                                    <h3>Current Availability ({slots.length} slots)</h3>
                                </div>
                                {slots.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🕐</div>
                                        <p>No slots added yet</p>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Start Time</th>
                                                    <th>End Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {slots.map((slot, i) => (
                                                    <tr key={i}>
                                                        <td>{slot.date}</td>
                                                        <td>{slot.startTime}</td>
                                                        <td>{slot.endTime}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DoctorDashboard;
