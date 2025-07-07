import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateGroup.css";

const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const createGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/create-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: groupName,
          description: groupDescription,
          subject: subject,
          isPrivate: isPrivate,
          createdBy: "user123" 
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create group");
      }

      const data = await res.json();
      navigate(`/study-group/${data.id}`); // Navigate to the newly created group
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-card">
        <div className="create-group-header">
          <h1>Create Study Group</h1>
          <p className="subtitle">Design your own collaborative learning space</p>
        </div>

        {error && (
          <div className="error-alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={createGroup} className="create-group-form">
          <div className="form-group">
            <label htmlFor="groupName">Group Name <span className="required">*</span></label>
            <input
              id="groupName"
              type="text"
              placeholder="Enter a memorable name for your group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="create-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Study Group'}
          </button>
          
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/join-group')}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;