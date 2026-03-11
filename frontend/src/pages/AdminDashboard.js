import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [appointments, setAppointments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [doctorReport, setDoctorReport] = useState([]);
    const [deptReport, setDeptReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Department form
    const [deptForm, setDeptForm] = useState({ name: '', description: '' });
    const [editingDept, setEditingDept] = useState(null);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [aptRes, deptRes, docRes, drRes, revRes] = await Promise.all([
                adminAPI.getAppointments(),
                adminAPI.getDepartments(),
                adminAPI.getDoctors(),
                adminAPI.getAppointmentsPerDoctor(),
                adminAPI.getRevenuePerDepartment(),
            ]);
            setAppointments(aptRes.data);
            setDepartments(deptRes.data);
            setDoctors(docRes.data);
            setDoctorReport(drRes.data);
            setDeptReport(revRes.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await adminAPI.cancelAppointment(id);
            setSuccess('Appointment cancelled');
            loadAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await adminAPI.updateDepartment(editingDept.id, deptForm);
                setSuccess('Department updated');
            } else {
                await adminAPI.createDepartment(deptForm);
                setSuccess('Department created');
            }
            setDeptForm({ name: '', description: '' });
            setEditingDept(null);
            loadAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save department');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleEditDept = (dept) => {
        setEditingDept(dept);
        setDeptForm({ name: dept.name, description: dept.description || '' });
        setActiveTab('departments');
    };

    const handleDeleteDept = async (id) => {
        if (!window.confirm('Delete this department?')) return;
        try {
            await adminAPI.deleteDepartment(id);
            setSuccess('Department deleted');
            loadAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete');
            setTimeout(() => setError(''), 3000);
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

    // Dashboard stats
    const totalApt = appointments.length;
    const bookedCount = appointments.filter((a) => a.status === 'BOOKED').length;
    const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
    const totalRevenue = appointments
        .filter((a) => a.status !== 'CANCELLED')
        .reduce((sum, a) => sum + (a.fee || 500), 0);

    const maxDrCount = Math.max(...doctorReport.map((r) => r.count || 0), 1);
    const maxDeptRevenue = Math.max(...deptReport.map((r) => r.revenue || 0), 1);

    const barColors = ['blue', 'green', 'orange', 'cyan'];

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="navbar-left">
                    <div className="navbar-logo"><span>🏥</span> HMS</div>
                </div>
                <div className="navbar-right">
                    <div className="user-badge">
                        🛡️ {user?.name}
                        <span className="role-tag">Admin</span>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="page-wrapper">
                <aside className="sidebar">
                    <div className="sidebar-brand">
                        <h2><span>🛡️</span> Admin Panel</h2>
                    </div>
                    <ul className="sidebar-nav">
                        <li>
                            <a href="#dashboard" className={activeTab === 'dashboard' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
                                <span className="nav-icon">📊</span> Dashboard
                            </a>
                        </li>
                        <li>
                            <a href="#appointments" className={activeTab === 'appointments' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('appointments'); }}>
                                <span className="nav-icon">📋</span> Appointments
                            </a>
                        </li>
                        <li>
                            <a href="#departments" className={activeTab === 'departments' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('departments'); }}>
                                <span className="nav-icon">🏢</span> Departments
                            </a>
                        </li>
                        <li>
                            <a href="#reports" className={activeTab === 'reports' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}>
                                <span className="nav-icon">📈</span> Reports
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

                    {/* ====== DASHBOARD TAB ====== */}
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>Admin Dashboard</h2>
                                    <p>Overview of hospital appointment system</p>
                                </div>
                            </div>

                            <div className="card-grid" style={{ marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon blue">📋</div>
                                    <div className="stat-info">
                                        <h4>{totalApt}</h4>
                                        <p>Total Appointments</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green">👨‍⚕️</div>
                                    <div className="stat-info">
                                        <h4>{doctors.length}</h4>
                                        <p>Active Doctors</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orange">🏢</div>
                                    <div className="stat-info">
                                        <h4>{departments.length}</h4>
                                        <p>Departments</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan">💰</div>
                                    <div className="stat-info">
                                        <h4>₹{totalRevenue.toLocaleString()}</h4>
                                        <p>Total Revenue</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-grid">
                                <div className="stat-card">
                                    <div className="stat-icon cyan">🔔</div>
                                    <div className="stat-info">
                                        <h4>{bookedCount}</h4>
                                        <p>Booked</p>
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
                                <div className="stat-card">
                                    <div className="stat-icon red">❌</div>
                                    <div className="stat-info">
                                        <h4>{cancelledCount}</h4>
                                        <p>Cancelled</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ====== APPOINTMENTS TAB ====== */}
                    {activeTab === 'appointments' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>All Appointments</h2>
                                    <p>Manage all hospital appointments</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="loading"><div className="spinner"></div> Loading...</div>
                            ) : (
                                <div className="card">
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Patient</th>
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
                                                        <td>#{apt.id}</td>
                                                        <td><strong>{apt.patientName}</strong></td>
                                                        <td>{apt.doctorName}</td>
                                                        <td>{apt.department}</td>
                                                        <td>{apt.appointmentDate}</td>
                                                        <td>{apt.startTime} - {apt.endTime}</td>
                                                        <td>{getStatusBadge(apt.status)}</td>
                                                        <td>₹{apt.fee || 500}</td>
                                                        <td>
                                                            {(apt.status === 'BOOKED' || apt.status === 'CONFIRMED') && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleCancelAppointment(apt.id)}
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

                    {/* ====== DEPARTMENTS TAB ====== */}
                    {activeTab === 'departments' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>Manage Departments</h2>
                                    <p>Add, edit, or remove hospital departments</p>
                                </div>
                            </div>

                            {/* Add/Edit Form */}
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div className="card-header">
                                    <h3>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
                                    {editingDept && (
                                        <button className="btn btn-outline btn-sm" onClick={() => {
                                            setEditingDept(null);
                                            setDeptForm({ name: '', description: '' });
                                        }}>Cancel Edit</button>
                                    )}
                                </div>
                                <form onSubmit={handleCreateDept}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Department Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Cardiology"
                                                value={deptForm.name}
                                                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Brief description"
                                                value={deptForm.description}
                                                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary">
                                        {editingDept ? 'Update Department' : '+ Add Department'}
                                    </button>
                                </form>
                            </div>

                            {/* Departments Table */}
                            <div className="card">
                                <div className="card-header">
                                    <h3>Departments ({departments.length})</h3>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {departments.map((dept) => (
                                                <tr key={dept.id}>
                                                    <td>#{dept.id}</td>
                                                    <td><strong>{dept.name}</strong></td>
                                                    <td>{dept.description || '—'}</td>
                                                    <td>
                                                        <span className={`badge ${dept.active ? 'badge-completed' : 'badge-cancelled'}`}>
                                                            {dept.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button className="btn btn-outline btn-sm" onClick={() => handleEditDept(dept)}>Edit</button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDept(dept.id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ====== REPORTS TAB ====== */}
                    {activeTab === 'reports' && (
                        <>
                            <div className="page-header">
                                <div>
                                    <h2>Reports & Analytics</h2>
                                    <p>Aggregated reports of appointments and revenue</p>
                                </div>
                            </div>

                            <div className="report-grid">
                                {/* Appointments per Doctor */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3>📊 Appointments per Doctor</h3>
                                    </div>
                                    {doctorReport.length === 0 ? (
                                        <div className="empty-state"><p>No data available</p></div>
                                    ) : (
                                        <div className="chart-bar-container">
                                            {doctorReport.map((item, i) => (
                                                <div className="chart-bar-row" key={i}>
                                                    <div className="chart-bar-label">{item.label}</div>
                                                    <div className="chart-bar-track">
                                                        <div
                                                            className={`chart-bar-fill ${barColors[i % barColors.length]}`}
                                                            style={{ width: `${(item.count / maxDrCount) * 100}%` }}
                                                        >
                                                            {item.count}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Revenue per Department */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3>💰 Revenue per Department</h3>
                                    </div>
                                    {deptReport.length === 0 ? (
                                        <div className="empty-state"><p>No data available</p></div>
                                    ) : (
                                        <div className="chart-bar-container">
                                            {deptReport.map((item, i) => (
                                                <div className="chart-bar-row" key={i}>
                                                    <div className="chart-bar-label">{item.label || 'Unknown'}</div>
                                                    <div className="chart-bar-track">
                                                        <div
                                                            className={`chart-bar-fill ${barColors[i % barColors.length]}`}
                                                            style={{ width: `${(item.revenue / maxDeptRevenue) * 100}%` }}
                                                        >
                                                            ₹{(item.revenue || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="chart-bar-value">{item.count} appts</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
