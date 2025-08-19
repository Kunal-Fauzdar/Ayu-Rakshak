// PatientMessages.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import './Messages.css';

const PatientMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await fetch('http://localhost:5051/api/appointments/patient-messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: user.id })
            });

            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
            <Navbar />
            
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="messages-header text-center mb-4">
                            <h2 className="fw-bold text-success mb-2">
                                <i className="bi bi-chat-dots me-2"></i>
                                Your Messages
                            </h2>
                            <p className="text-muted">Scheduled appointments and updates from doctors</p>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="empty-state">
                                    <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                                    <h4 className="text-muted">No messages yet</h4>
                                    <p className="text-muted">Your appointment schedules will appear here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="messages-list">
                                {messages.map((message) => (
                                    <div key={message._id} className="message-card card shadow-sm mb-3">
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="message-avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                                                    <i className="bi bi-person-check"></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1 text-success fw-bold">
                                                        Dr. {message.doctorName}
                                                    </h5>
                                                    <small className="text-muted">
                                                        {new Date(message.createdAt).toLocaleString('en-IN')}
                                                    </small>
                                                </div>
                                                <span className="badge bg-success-subtle text-success">
                                                    {message.status}
                                                </span>
                                            </div>
                                            
                                            <div className="message-content">
                                                <div className="alert alert-success border-0 mb-3">
                                                    <i className="bi bi-calendar-check me-2"></i>
                                                    <strong>Appointment Scheduled!</strong>
                                                </div>
                                                
                                                <div className="appointment-details bg-light rounded p-3">
                                                    <div className="row">
                                                        <div className="col-md-6 mb-2">
                                                            <i className="bi bi-calendar3 text-success me-2"></i>
                                                            <strong>Date:</strong> {formatDate(message.scheduledDate)}
                                                        </div>
                                                        <div className="col-md-6 mb-2">
                                                            <i className="bi bi-clock text-success me-2"></i>
                                                            <strong>Time:</strong> {message.scheduledTime}
                                                        </div>
                                                    </div>
                                                </div>
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

export default PatientMessages;
