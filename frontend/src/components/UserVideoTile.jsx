import React from "react";

const UserVideoTile = ({ userId, videoRef, isSpeaking, isLocal }) => {
  return (
    <div className={`relative rounded overflow-hidden ${isSpeaking ? 'border-4 border-green-400' : 'border-2 border-gray-600'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {isLocal ? "You" : userId}
      </div>
    </div>
  );
};

export default UserVideoTile;
