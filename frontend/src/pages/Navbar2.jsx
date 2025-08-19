import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from './AuthContext';
import "./Navbar.css";

const Navbar2 = () => {
  const [activeNav, setActiveNav] = useState("appointment");
    const { user, logout, isAuthenticated } = useAuth();
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        {/* Brand Logo */}
        <Link className="navbar-brand fw-bold text-success" to="/">
          <i className="bi bi-heart-pulse me-2"></i>
          Ayu-Rakshak
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <Link
                className={`nav-link nav-pill px-4 py-2 mx-2 ${
                  activeNav === "appointment" ? "active" : ""
                }`}
                to="/doctor"
                onClick={() => setActiveNav("appointment")}
              >
                <i className="bi bi-camera-video me-2"></i>
                Appointments
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link nav-pill px-4 py-2 mx-2 ${
                  activeNav === "chats" ? "active" : ""
                }`}
                to="/chats"
                onClick={() => setActiveNav("chats")}
              >
                <i className="bi bi-chat-dots me-2"></i>
                Chats
              </Link>
            </li>
          </ul>

          {/* Profile Section */}
          <div className="navbar-nav">
            <div className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle text-dark profile-dropdown"
                href="#profile"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Profile"
                  className="profile-img rounded-circle me-2"
                  width="32"
                  height="32"
                />
                {user?.name || user?.username}
              </a>
              <ul className="dropdown-menu dropdown-menu-end profile-menu shadow">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person me-2 text-success"></i>@{user?.username}
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item text-danger" to="/logout">
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar2;
