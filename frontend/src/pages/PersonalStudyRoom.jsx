import React, { useState, useRef, useEffect, useCallback } from "react";
import Draggable from "react-draggable";
import "../styles/personalstudyroom.css";
import { FaHeadphones, FaClock, FaTasks, FaStickyNote, FaSearch } from "react-icons/fa";
import axios from "axios";
import ReactPlayer from "react-player";
import { IoLogoYoutube } from "react-icons/io5";

const API_KEY = import.meta.env.YOUTUBE_API_KEY;

// Pomodoro Timer Component (Ensure it's imported or defined)
const PomodoroTimer = ({ time, setTime, isRunning, setIsRunning, mode, switchMode }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="timer">
    <h2>Pomodoro Timer</h2>
    <h1>{formatTime(time)}</h1>  {/* ✅ Only show time */}
  </div>
  );
};

const PersonalStudyRoom = () => {
  const sidebarRef = useRef(null);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);
  const tasksRef = useRef(null);
  const notesRef = useRef(null);

  const [showMedia, setShowMedia] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [showTimer, setShowTimer] = useState(true);
  
  const [showTasks, setShowTasks] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  
  const [showNotes, setShowNotes] = useState(true);
  const [notesInput, setNotesInput] = useState("");

  // Timer State
  const [time, setTime] = useState(25 * 60); // 25 min
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Pomodoro"); // Pomodoro / Break

  // Timer Countdown Logic
  useEffect(() => {
    let timer;
    if (isRunning && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    } else if (time === 0) {
      setIsRunning(false);
      switchMode();
    }
    return () => clearInterval(timer);
  }, [isRunning, time]);

  const switchMode = () => {
    if (mode === "Pomodoro") {
      setMode("Break");
      setTime(5 * 60); // 5 min break
    } else {
      setMode("Pomodoro");
      setTime(25 * 60); // 25 min work
    }
    setIsRunning(false);
  };

  // Fetch Videos 
  const fetchVideos = useCallback(async (query) => {
    if (!query.trim()) return; // 🚫 Don't call API on empty input
  
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/youtube`, {
        params: { q: query },
      });

  
      if (response.data.items?.length > 0) {
        setVideos(response.data.items);
        setSelectedVideo(response.data.items[0].id.videoId);
      } else {
        console.warn("No videos found for:", query);
      }
    } catch (error) {
      console.error("Error fetching videos:", error.response ? error.response.data : error);
    }
  }, []);
  

  useEffect(() => {
    fetchVideos("lofi study music"); // default on load
  }, [fetchVideos]);
  
  return (
    <div className="personal-study-room">
      <video className="background-video" src="/assets/videos/studyBg.mp4" autoPlay loop muted></video>

      {/* Sidebar */}
      <Draggable nodeRef={sidebarRef} bounds="parent">
        <div ref={sidebarRef} className="sidebar">
          <button onClick={()=>setShowMedia(!showMedia)}><FaHeadphones /> Media</button>
          <button onClick={() => setShowTimer(!showTimer)}><FaClock /> Timer</button>
          <button onClick={() => setShowTasks(!showTasks)}><FaTasks /> Tasks</button>
          <button onClick={()=> setShowNotes(!showNotes)}><FaStickyNote /> Notes</button>
        </div>
      </Draggable>

      {/* YouTube Player */}
      {showMedia && (
      <Draggable nodeRef={mediaRef} bounds="parent">
        <div ref={mediaRef} className="media-player">
        <h3><IoLogoYoutube /> YouTube</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchVideos(searchTerm);
              }}
            />
            <button onClick={() => fetchVideos(searchTerm)}><FaSearch /></button>
          </div>

          {selectedVideo && (
            <ReactPlayer url={`https://www.youtube.com/watch?v=${selectedVideo}`} controls width="100%" />
          )}

          <ul className="video-list">
            {videos.slice(0, 1).map((video) => (
              <li key={video.id.videoId} onClick={() => setSelectedVideo(video.id.videoId)}>
                <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
                <span>{video.snippet.title}</span>
              </li>
            ))}
          </ul>
          <button className="close-btn" onClick={() => setShowMedia(false)}>❌</button>
        </div>
      </Draggable>
      )}

      {/* Timer Component */}
      {showTimer && (
        <Draggable nodeRef={timerRef} bounds="parent">
          <div ref={timerRef} className="timer-container">
            <PomodoroTimer
              time={time}
              setTime={setTime}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              mode={mode}
              switchMode={switchMode}
            />
            {/* ✅ Timer Control Buttons */}
            <div className="timer-controls">
              <button onClick={() => setIsRunning(!isRunning)}>
                {isRunning ? "⏸ Pause" : "▶ Start"}
              </button>
              <button onClick={switchMode}>🔄 Switch Mode</button>
              <button onClick={() => setTime(mode === "Pomodoro" ? 25 * 60 : 5 * 60)}>⏮ Reset</button>
            </div>
            <button className="close-btn" onClick={() => setShowTimer(false)}>❌</button>
          </div>
        </Draggable>
      )}

      {/* Task Manager */}
      {showTasks && (
        <Draggable nodeRef={tasksRef} bounds="parent">
          <div ref={tasksRef} className="task-container">
            <h3>Tasks</h3>
            <div className="task-input">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Enter task..."
              />
              <button onClick={() => {
                if (taskInput.trim() !== "") {
                  setTasks([...tasks, { text: taskInput, completed: false }]);
                  setTaskInput("");
                }
              }}>Add</button>
            </div>
            <ul className="task-list">
              {tasks.map((task, index) => (
                <li key={index} className={task.completed ? "completed" : ""}>
                  <span onClick={() => setTasks(tasks.map((t, i) =>
                    i === index ? { ...t, completed: !t.completed } : t
                  ))}>{task.text}</span>
                  <button className="task-close-btn" onClick={() =>
                    setTasks(tasks.filter((_, i) => i !== index))
                  }>❌</button>
                </li>
              ))}
            </ul>
            <button className="close-btn" onClick={() => setShowTasks(false)}>❌</button>
          </div>
        </Draggable>
      )}
            {showNotes && (
        <Draggable nodeRef={notesRef} bounds="parent">
          <div ref={notesRef} className="notes-container">
            <h3>Notes</h3>
            <div className="notes-input">
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write your notes here..."
              />
            </div>
            <button className="close-btn" onClick={() => setShowNotes(false)}>❌</button>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default PersonalStudyRoom;
