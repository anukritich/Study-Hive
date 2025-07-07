import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import "./FindingBuddy.css";

const FindingBuddy = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(true);
  
  useEffect(() => {
    if (socket) {
      socket.on('matched', ({ groupId }) => {
        setSearching(false);
        navigate(`/study-group/${groupId}`);
      });
      
      return () => {
        socket.off('matched');
      };
    }
  }, [socket, navigate]);
  
  const handleCancel = () => {
    if (socket) {
      socket.emit('cancel-matchmaking'); // emit cancel event to server
    }
    setSearching(false);
    navigate('/dashboard');
  };
  
  return (
    <div className="finding-buddy-container">
      <div className="finding-buddy-card">
        <h2 className="finding-buddy-title">
          {searching ? "Finding a Study Buddy..." : "Stopped Searching"}
        </h2>
        
        {searching ? (
          <>
            <div className="finding-buddy-message">
              <p>Please wait while we match you with someone! 🚀</p>
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            </div>
            
            <button 
              className="cancel-button" 
              onClick={handleCancel}
            >
              Cancel Search
            </button>
          </>
        ) : (
          <div className="redirecting-message">
            Redirecting...
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingBuddy;