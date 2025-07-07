import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinGroup.css";

const JoinGroup = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_SERVER_URL}/study-groups`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch groups");
        }
        return res.json();
      })
      .then((data) => {
        setGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching groups:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const joinGroup = async (groupId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/join-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userId: "user123" }),
      });

      if (!response.ok) {
        throw new Error("Failed to join group");
      }

      navigate(`/study-group/${groupId}`);
    } catch (err) {
      console.error("Error joining group:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="join-group-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="join-group-container">
        <div className="error-message">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const publicGroups = groups.filter(group => !group.isPrivate);

  return (
    <div className="join-group-container">
      <div className="join-group-header">
        <h1>Join a Study Group</h1>
        <p className="subtitle">Find and join public study groups to collaborate with others</p>
      </div>

      {publicGroups.length === 0 ? (
        <div className="no-groups">
          <p>No public study groups available at the moment.</p>
        </div>
      ) : (
        <div className="group-list">
          {publicGroups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-info">
                <h3>{group.name}</h3>
                {group.description && <p className="group-description">{group.description}</p>}
                <div className="group-meta">
                  <span className="members-count">
                    {group.memberCount || 0} members
                  </span>
                  {group.subject && (
                    <span className="group-subject">{group.subject}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => joinGroup(group.id)}
                className="join-button"
              >
                Join Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JoinGroup;