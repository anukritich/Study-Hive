import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/chat.css";
import VideoChat from "../components/VideoChat";

// Create a single socket instance with more robust configuration
const backendURL = import.meta.env.VITE_SERVER_URL || 
                   (window.location.hostname === 'localhost' ? 
                   'http://localhost:5000' : 
                   window.location.origin.replace(/^https?:\/\/[^:]+(?::\d+)?/, 'https://your-backend-domain.com'));

console.log("Connecting to backend at:", backendURL);

const socket = io(backendURL, {
  // Allow falling back to polling if websocket fails
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
  withCredentials: true,
});

// Socket connection monitoring
socket.on('connect', () => {
  console.log('Socket connected successfully!', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

const StudyGroupChat = () => {
  const { groupId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showVideo, setShowVideo] = useState(true);
  const [videoWidth, setVideoWidth] = useState(40); // Start with 40% video, 60% chat
  const [dragging, setDragging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const messagesEndRef = useRef(null);
  
  // Use userData from localStorage (same as Dashboard)
  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState("");
  
  // Get user data at component mount
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      
      // Use email username as userId to match dashboard display
      const username = parsedUserData.email.split('@')[0];
      setUserId(username);
      
      // Also store in userId for compatibility
      localStorage.setItem("userId", username);
    } else {
      // Fallback if userData doesn't exist
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        const newUserId = `User_${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem("userId", newUserId);
        setUserId(newUserId);
      }
    }
  }, []);

  useEffect(() => {
    // Only join room if userId is available
    if (!userId) return;
    
    // Ensure socket is connected before joining room
    if (socket.connected) {
      console.log(`Joining room ${groupId} as ${userId}`);
      socket.emit("joinRoom", groupId);  // Keep it simple if backend expects just groupId
    } else {
      console.log("Socket not connected, waiting...");
      socket.on('connect', () => {
        console.log(`Socket connected, now joining room ${groupId} as ${userId}`);
        socket.emit("joinRoom", groupId);
      });
    }

    socket.on("loadMessages", (msgs) => {
      console.log(`Loaded ${msgs.length} messages`);
      setMessages(msgs);
      setConnectionStatus("Connected to chat room");
    });

    socket.on("message", (msg) => {
      console.log("New message received");
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("loadMessages");
      socket.off("message");
    };
  }, [groupId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      roomId: groupId,
      user: userId,
      text: message,
    };
    console.log("Sending message:", newMessage);
    socket.emit("message", newMessage);
    setMessage(""); // Clear input
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVideoChat = () => {
    setShowVideo(!showVideo);
  };

  // Handle dragging to resize
  const startDrag = (e) => {
    e.preventDefault(); // Prevent text selection while dragging
    setDragging(true);
  };
  
  const stopDrag = () => setDragging(false);
  
  const onDrag = (e) => {
    if (!dragging) return;
    const newVideoWidth = (e.clientX / window.innerWidth) * 100;
    if (newVideoWidth > 10 && newVideoWidth < 90) {
      setVideoWidth(newVideoWidth);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging]);

  return (
    <div className="study-group-page">
      {/* Connection Status */}
      <div className="connection-status">
        {connectionStatus}
      </div>
      
      {/* Chat Header */}
      <div className="chat-header">
        <div>Study Group Chat (You: {userId || "Connecting..."})</div>
        <button
          onClick={toggleVideoChat}
          className={`video-toggle-btn ${showVideo ? 'active' : ''}`}
        >
          {showVideo ? '📺 Hide Video' : '📺 Show Video'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="chat-content-container">
        {/* Video Section */}
        {showVideo && (
          <div
            style={{ width: `${videoWidth}%` }}
            className="video-container"
          >
            <VideoChat
              socket={socket}
              roomId={groupId}
              userId={userId}
              isOpen={showVideo}
            />
          </div>
        )}

        {/* Drag Divider */}
        {showVideo && (
          <div
            onMouseDown={startDrag}
            className="divider-handle"
          ></div>
        )}

        {/* Chat Section */}
        <div className="chat-container">
          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <p className="no-messages">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isSameUser = prevMsg && prevMsg.user === msg.user;
                return (
                  <div key={index} className={`message-container ${msg.user === userId ? "user" : "other"}`}>
                    {!isSameUser && <span className="message-username">{msg.user}</span>}
                    <div className="message-bubble">{msg.text}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupChat;
