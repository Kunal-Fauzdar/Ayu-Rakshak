// DoctorMessages.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Navbar2 from './Navbar2';
import './Messages.css';

const DoctorMessages = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schedulingRequest, setSchedulingRequest] = useState(null);
    const [scheduleData, setScheduleData] = useState({
        date: '',
        time: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5051/api/appointments/doctor-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({id: user.id})
            });

            const data = await response.json();
            if (data.success) {
                setRequests(data.messages);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSubmit = async (requestId) => {
        if (!scheduleData.date || !scheduleData.time) {
            alert('Please select both date and time');
            return;
        }

        try {
            // const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5051/api/appointments/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    scheduledDate: scheduleData.date,
                    scheduledTime: scheduleData.time,
                    doctorId: user.id,
                    doctorName: user.name
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Appointment scheduled successfully!');
                setSchedulingRequest(null);
                setScheduleData({ date: '', time: '' });
                fetchRequests(); // Refresh the list
            } else {
                alert(data.message || 'Failed to schedule appointment');
            }
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            alert('Network error occurred');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-app">
            <Navbar2 />
            
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="messages-header text-center mb-4">
                            <h2 className="fw-bold text-success mb-2">
                                <i className="bi bi-inbox me-2"></i>
                                Patient Requests
                            </h2>
                            <p className="text-muted">Manage appointment requests from patients</p>
                        </div>

                        {requests.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="empty-state">
                                    <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                                    <h4 className="text-muted">No requests yet</h4>
                                    <p className="text-muted">Patient appointment requests will appear here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {requests.map((request) => (
                                    <div key={request._id} className="request-card card shadow-sm mb-3">
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="request-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                                    <i className="bi bi-person"></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1 fw-bold">
                                                        {request.senderName}
                                                    </h5>
                                                    <small className="text-muted">
                                                        {new Date(request.createdAt).toLocaleString('en-IN')}
                                                    </small>
                                                </div>
                                                <span className={`badge ${
                                                    request.status === 'pending' ? 'bg-warning' :
                                                    request.status === 'accepted' ? 'bg-success' : 'bg-danger'
                                                }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            
                                            <div className="request-content">
                                                <div className="alert alert-info border-0 mb-3">
                                                    <i className="bi bi-calendar-plus me-2"></i>
                                                    <strong>Meeting Request</strong> for {request.specialty} consultation
                                                </div>

                                                {request.status === 'pending' && (
                                                    <div className="scheduling-section">
                                                        {schedulingRequest === request._id ? (
                                                            <div className="schedule-form bg-light rounded p-3">
                                                                <h6 className="mb-3 text-success">
                                                                    <i className="bi bi-calendar-event me-2"></i>
                                                                    Schedule Appointment
                                                                </h6>
                                                                <div className="row">
                                                                    <div className="col-md-6 mb-3">
                                                                        <label className="form-label fw-bold">Date:</label>
                                                                        <input
                                                                            type="date"
                                                                            className="form-control"
                                                                            value={scheduleData.date}
                                                                            onChange={(e) => setScheduleData({
                                                                                ...scheduleData,
                                                                                date: e.target.value
                                                                            })}
                                                                            min={new Date().toISOString().split('T')[0]}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-6 mb-3">
                                                                        <label className="form-label fw-bold">Time:</label>
                                                                        <select
                                                                            className="form-select"
                                                                            value={scheduleData.time}
                                                                            onChange={(e) => setScheduleData({
                                                                                ...scheduleData,
                                                                                time: e.target.value
                                                                            })}
                                                                        >
                                                                            <option value="">Select time</option>
                                                                            <option value="09:00 AM">09:00 AM</option>
                                                                            <option value="10:00 AM">10:00 AM</option>
                                                                            <option value="11:00 AM">11:00 AM</option>
                                                                            <option value="12:00 PM">12:00 PM</option>
                                                                            <option value="02:00 PM">02:00 PM</option>
                                                                            <option value="03:00 PM">03:00 PM</option>
                                                                            <option value="04:00 PM">04:00 PM</option>
                                                                            <option value="05:00 PM">05:00 PM</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex gap-2">
                                                                    <button
                                                                        className="btn btn-success"
                                                                        onClick={() => handleScheduleSubmit(request._id)}
                                                                    >
                                                                        <i className="bi bi-check-circle me-2"></i>
                                                                        Schedule Appointment
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-outline-secondary"
                                                                        onClick={() => {
                                                                            setSchedulingRequest(null);
                                                                            setScheduleData({ date: '', time: '' });
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() => setSchedulingRequest(request._id)}
                                                            >
                                                                <i className="bi bi-calendar-plus me-2"></i>
                                                                Schedule Meeting
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {request.status === 'accepted' && (
                                                    <div className="alert alert-success border-0">
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Appointment scheduled successfully
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorMessages;
