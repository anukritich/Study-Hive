// Fully Updated StandaloneVideoChat.jsx compatible with updated backend
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import generateRoomId from "../utils/generateRoomId";
import VideoControls from "../components/VideoControls";
import UserVideoTile from "../components/UserVideoTile";

const StandaloneVideoChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [finalRoomId, setFinalRoomId] = useState(roomId);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [screenSharing, setScreenSharing] = useState(false);
  const videoRefs = useRef({});
  const screenShareRef = useRef(null);
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    if (!roomId) {
      const newRoomId = generateRoomId();
      setFinalRoomId(newRoomId);
      navigate(`/video/${newRoomId}`, { replace: true });
    }
  }, [roomId, navigate]);

  useEffect(() => {
    const backendURL = import.meta.env.VITE_SERVER_URL;
    const newSocket = io(backendURL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
      withCredentials: true,
    });

    setSocket(newSocket);
    let id = localStorage.getItem("videoUserId");
    if (!id) {
      id = `Guest_${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem("videoUserId", id);
    }
    setUserId(id);
    newSocket.emit("join-video-room", { roomId: finalRoomId, userId: id });

    newSocket.on("user-list", setUsers);

    newSocket.on("user-joined", async (newUserId) => {
      if (newUserId === userId) return;
      const pc = createPeerConnection(newUserId);
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          if (!pc.getSenders().some(s => s.track === track)) {
            pc.addTrack(track, localStream.current);
          }
        });
      }
      if (userId < newUserId) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      newSocket.emit("offer", { to: newUserId, offer });
    });

    newSocket.on("offer", async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          if (!pc.getSenders().some(s => s.track === track)) {
            pc.addTrack(track, localStream.current);
          }
        });
      }
      const polite = userId > from;
      if (pc.signalingState !== "stable" && polite) {
        await pc.setLocalDescription({ type: "rollback" });
      } else if (!polite) {
        console.warn("Impolite peer ignoring offer");
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit("answer", { to: from, answer });
    });

    newSocket.on("answer", async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    newSocket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => newSocket.disconnect();
  }, [finalRoomId, userId]);

  useEffect(() => {
    if (userId && videoRefs.current[userId]) addLocalStream();
  }, [userId, users]);

  const addLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (videoRefs.current[userId]) {
        videoRefs.current[userId].srcObject = stream;
      }
    } catch (err) {
      console.error("Media error:", err);
    }
  };

  const createPeerConnection = (targetUserId) => {
    if (peerConnections.current[targetUserId]) return peerConnections.current[targetUserId];
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:relay1.expressturn.com:3478", username: "efgh", credential: "5678" }
      ]
    });
    pc.ontrack = (event) => {
      if (videoRefs.current[targetUserId]) {
        videoRefs.current[targetUserId].srcObject = event.streams[0];
      }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { to: targetUserId, candidate: e.candidate });
    };
    peerConnections.current[targetUserId] = pc;
    return pc;
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
    localStream.current?.getAudioTracks().forEach(t => t.enabled = !isAudioEnabled);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
    localStream.current?.getVideoTracks().forEach(t => t.enabled = !isVideoEnabled);
  };

  const leaveRoom = () => {
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      <header className="p-4 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold">StudyHive Video Chat</h1>
        <p className="text-sm text-gray-400 mt-2">
          Share this link: <span className="text-blue-400">{window.location.href}</span>
        </p>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {users.map((u) => (
          <UserVideoTile
            key={u}
            userId={u}
            isSpeaking={false}
            isLocal={u === userId}
            videoRef={(ref) => (videoRefs.current[u] = ref)}
          />
        ))}
      </main>
      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        leaveRoom={leaveRoom}
      />
    </div>
  );
};

export default StandaloneVideoChat;
