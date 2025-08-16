import React, { useState } from 'react';
import './LoginPage.css'; // We'll create this CSS file
import { useNavigate } from 'react-router-dom';
const LoginPage = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const registerUser = async (userData) => {
    const response = await fetch('http://localhost:5051/api/v1/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    return { data, status: response.status };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, status } = await registerUser(formData);

      if (status === 201) {
        // Registration successful
        setSuccessMessage(data.message || 'Registration successful!');
        
        // Clear form
        setFormData({ name: '', username: '', password: '' });
        
        // Redirect to login page after a delay
        setTimeout(() => {
          navigate('/patient');
        }, 2000);
        
      } else if (status === 302) { // Using 302 instead of 201 as per your backend
        // User already exists
        setErrors({ username: data.message || 'User already exists' });
        
      } else {
        // Other errors
        setErrors({ submit: data.message || 'Registration failed. Please try again.' });
      }

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
        <img src="./start_background.png" alt="Background" />
      <div className="login-card">
        <div className="login-header">
          <div className="hospital-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.76.21 3.92 0 5.16-1 9-5.45 9-11V7l-10-5z"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </div>
          <h1>Hospital Portal</h1>
          <p>Secure access to your healthcare information</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userType">I am a:</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              
            </select>
          </div>

            <div className="form-group">
            <label htmlFor="name">Email Address</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        
      </div>

      <div className="emergency-notice">
        <strong>Emergency?</strong> Call 911 or visit our Emergency Department immediately.
      </div>
    </div>
  );
};

export default LoginPage;
