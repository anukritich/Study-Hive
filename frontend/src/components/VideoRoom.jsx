import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoChat from "./VideoChat";
import generateRoomId from "../utils/generateRoomId";

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [finalRoomId, setFinalRoomId] = useState(roomId);

  useEffect(() => {
    if (!roomId) {
      const newRoomId = generateRoomId();
      setFinalRoomId(newRoomId);
      navigate(`/video/${newRoomId}`, { replace: true });
    }
  }, [roomId, navigate]);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-2">
        Share this link to invite:{" "}
        <span className="text-blue-400">{window.location.href}</span>
      </p>
      <VideoChat roomId={finalRoomId} />
    </div>
  );
};

export default VideoRoom;
