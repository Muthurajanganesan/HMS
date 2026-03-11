import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Booking modal state
    const [bookingModal, setBookingModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        appointmentDate: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        if (activeTab === 'doctors') loadDoctors();
        else loadAppointments();
    }, [activeTab]);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const res = await patientAPI.getDoctors();
            setDoctors(res.data);
        } catch (err) {
            setError('Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const res = await patientAPI.getAppointments();
            setAppointments(res.data);
        } catch (err) {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadDoctors();
            return;
        }
        setLoading(true);
        try {
            const res = await patientAPI.searchDoctors(searchQuery, searchType);
            setDoctors(res.data);
        } catch (err) {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const openBooking = (doctor) => {
        setSelectedDoctor(doctor);
        setBookingForm({ appointmentDate: '', startTime: '', endTime: '' });
        setBookingModal(true);
        setError('');
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await patientAPI.bookAppointment({
                doctorId: selectedDoctor.id,
                appointmentDate: bookingForm.appointmentDate,
                startTime: bookingForm.startTime + ':00',
                endTime: bookingForm.endTime + ':00',
            });
            setSuccess('Appointment booked successfully!');
            setBookingModal(false);
            setActiveTab('appointments');
            loadAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Booking failed');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        try {
            await patientAPI.cancelAppointment(id);
            setSuccess('Appointment cancelled');
            loadAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel');
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

    return (
        <div className="app-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-left">
                    <div className="navbar-logo"><span>🏥</span> HMS</div>
                </div>
                <div className="navbar-right">
                    <div className="user-badge">
                        👤 {user?.name}
                        <span className="role-tag">Patient</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="page-wrapper">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <h2><span>🏥</span> Patient Portal</h2>
                    </div>
                    <ul className="sidebar-nav">
                        <li>
                            <a
                                href="#doctors"
                                className={activeTab === 'doctors' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('doctors'); }}
                            >
                                <span className="nav-icon">🔍</span> Search Doctors
                            </a>
                        </li>
                        <li>
                            <a
                                href="#appointments"
                                className={activeTab === 'appointments' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('appointments'); }}
                            >
                                <span className="nav-icon">📋</span> My Appointments
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

                {/* Main Content */}
                <main className="main-content">
                    {success && <div className="alert alert-success">✅ {success}</div>}
                    {error && !bookingModal && <div className="alert alert-error">⚠️ {error}</div>}

                    {activeTab === 'doctors' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>Search Doctors</h2>
                                    <p>Find and book appointments with available doctors</p>
                                </div>
                            </div>

                            <div className="search-bar">
                                <select
                                    className="form-control"
                                    style={{ maxWidth: '160px' }}
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                >
                                    <option value="name">By Name</option>
                                    <option value="specialization">By Specialization</option>
                                    <option value="department">By Department</option>
                                </select>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search doctors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                            </div>

                            {loading ? (
                                <div className="loading"><div className="spinner"></div> Loading doctors...</div>
                            ) : doctors.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">👨‍⚕️</div>
                                    <p>No doctors found</p>
                                </div>
                            ) : (
                                <div className="card-grid">
                                    {doctors.map((doc) => (
                                        <div key={doc.id} className="doctor-card">
                                            <div className="doctor-header">
                                                <div className="doctor-avatar">
                                                    {doc.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="doctor-name">{doc.name}</div>
                                                    <div className="doctor-spec">{doc.specialization}</div>
                                                </div>
                                            </div>
                                            <div className="doctor-info">
                                                <div className="info-row">🏢 {doc.department}</div>
                                                <div className="info-row">📧 {doc.email}</div>
                                                {doc.phone && <div className="info-row">📞 {doc.phone}</div>}
                                            </div>
                                            {doc.availableSlots && doc.availableSlots.length > 0 && (
                                                <div className="slots-section">
                                                    <h4>Available Slots</h4>
                                                    <div className="slot-tags">
                                                        {doc.availableSlots.slice(0, 6).map((slot, i) => (
                                                            <span key={i} className="slot-tag">
                                                                {slot.date} | {slot.startTime}-{slot.endTime}
                                                            </span>
                                                        ))}
                                                        {doc.availableSlots.length > 6 && (
                                                            <span className="slot-tag" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                                                                +{doc.availableSlots.length - 6} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%', marginTop: '12px' }}
                                                onClick={() => openBooking(doc)}
                                            >
                                                📅 Book Appointment
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'appointments' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>My Appointments</h2>
                                    <p>View and manage your appointments</p>
                                </div>
                                <button className="btn btn-primary" onClick={() => setActiveTab('doctors')}>
                                    + New Appointment
                                </button>
                            </div>

                            {loading ? (
                                <div className="loading"><div className="spinner"></div> Loading...</div>
                            ) : appointments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>No appointments yet. Search for a doctor to book one.</p>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Doctor</th>
                                                    <th>Department</th>
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
                                                        <td>
                                                            <strong>{apt.doctorName}</strong>
                                                            <br />
                                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{apt.doctorSpecialization}</span>
                                                        </td>
                                                        <td>{apt.department}</td>
                                                        <td>{apt.appointmentDate}</td>
                                                        <td>{apt.startTime} - {apt.endTime}</td>
                                                        <td>{getStatusBadge(apt.status)}</td>
                                                        <td>₹{apt.fee || 500}</td>
                                                        <td>
                                                            {(apt.status === 'BOOKED') && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleCancel(apt.id)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
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
                </main>
            </div>

            {/* Booking Modal */}
            {bookingModal && (
                <div className="modal-overlay" onClick={() => setBookingModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Book Appointment</h3>
                            <button className="btn btn-icon btn-outline" onClick={() => setBookingModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error">⚠️ {error}</div>}
                            {selectedDoctor && (
                                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <strong>{selectedDoctor.name}</strong> — {selectedDoctor.specialization}
                                    <br />
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>{selectedDoctor.department}</span>
                                </div>
                            )}
                            <form onSubmit={handleBooking}>
                                <div className="form-group">
                                    <label>Appointment Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={bookingForm.appointmentDate}
                                        onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={bookingForm.startTime}
                                            onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Time</label>
                                        <input
                                            type="time"
                                            className="form-control"
                                            value={bookingForm.endTime}
                                            onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                {selectedDoctor?.availableSlots && selectedDoctor.availableSlots.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                                            Available Slots
                                        </label>
                                        <div className="slot-tags">
                                            {selectedDoctor.availableSlots.map((slot, i) => (
                                                <span
                                                    key={i}
                                                    className="slot-tag"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setBookingForm({
                                                        appointmentDate: slot.date,
                                                        startTime: slot.startTime.substring(0, 5),
                                                        endTime: slot.endTime.substring(0, 5),
                                                    })}
                                                >
                                                    {slot.date} | {slot.startTime}-{slot.endTime}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: '16px' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setBookingModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Confirm Booking</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
