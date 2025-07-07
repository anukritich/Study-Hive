import React from "react";

const VideoControls = ({
  isAudioEnabled,
  isVideoEnabled,
  toggleAudio,
  toggleVideo,
  leaveRoom,
  startScreenShare
}) => {
  return (
    <div className="flex gap-2 justify-center mt-4 flex-wrap">
      <button onClick={toggleAudio} className="bg-gray-700 px-3 py-2 rounded">
        {isAudioEnabled ? "Mute 🎤" : "Unmute 🎤"}
      </button>
      <button onClick={toggleVideo} className="bg-gray-700 px-3 py-2 rounded">
        {isVideoEnabled ? "Stop Video 🎥" : "Start Video 🎥"}
      </button>
      <button onClick={startScreenShare} className="bg-gray-700 px-3 py-2 rounded">
        Share Screen 💻
      </button>
      <button onClick={leaveRoom} className="bg-red-700 px-3 py-2 rounded">
        Leave Room ❌
      </button>
    </div>
  );
};

export default VideoControls;
