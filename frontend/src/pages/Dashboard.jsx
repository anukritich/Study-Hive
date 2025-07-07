import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import './auth.css';
import './dashboard.css';


const Dashboard = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    if (socket) {
      socket.on('matched', ({ groupId }) => {
        navigate(`/study-group/${groupId}`);
      });

      return () => {
        socket.off('matched');
      };
    }
  }, [socket, navigate]);

  const handleFindBuddy = () => {
    if (socket && userData) {
      socket.emit('join-matchmaking-queue', userData);
      navigate("/finding-buddy");
    } else {
      alert("Socket not ready or user data missing!");
    }
  };

  if (!socket) {
    return (
      <div className="dashboard-container loading-state">
        <div className="loader"></div>
        <h2>Connecting to server...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="logo-area">
          <h1>StudyHive</h1>
        </div>

        {userData && (
          <div className="user-greeting">
            <span>Welcome, </span>
            <span className="highlight">{userData.email.split('@')[0]}</span>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Find Your Perfect Study Environment</h2>
          <p>Connect with like-minded students, join study groups, or create your own focused study space.</p>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card" onClick={() => navigate("/join-group")}>
            <div className="card-icon join-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Join a Study Group</h3>
            <p>Find and join existing study groups based on your interests and subjects.</p>
            <button className="card-btn join-btn">Join Group</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/create-group")}>
            <div className="card-icon create-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <h3>Create a Study Group</h3>
            <p>Start your own study group and invite others to collaborate.</p>
            <button className="card-btn create-btn">Create Group</button>
          </div>

          <div className="dashboard-card" onClick={handleFindBuddy}>
            <div className="card-icon buddy-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Find Study Buddy</h3>
            <p>Get matched with another student for one-on-one study sessions.</p>
            <button className="card-btn buddy-btn">Find Buddy</button>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/personal-study-room")}>
            <div className="card-icon personal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>Personal Study Room</h3>
            <p>Access your private study space with tools to maximize productivity.</p>
            <button className="card-btn personal-btn">Enter Room</button>
          </div>

          {/* <div className="dashboard-card" onClick={() => navigate("/video")}>
            <div className="card-icon video-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
            <h3>Video Chat</h3>
            <p>Connect face-to-face with other students via video conferencing.</p>
            <button className="card-btn video-btn">Start Video</button>
          </div> */}
        </div>
      </div>

      <div className="dashboard-footer">
        <button onClick={() => {
          localStorage.removeItem("userData");
          navigate("/login");
        }} className="logout-btn">
          Sign Out
        </button>

        <p className="copyright">© 2025 StudyHive. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Dashboard;
