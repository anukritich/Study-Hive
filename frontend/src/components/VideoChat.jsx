import React, { useEffect, useRef, useState } from "react";

const VideoChat = ({ socket, roomId, userId, isOpen }) => {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "efgh",
          credential: "5678"
        }
      ]
    };

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-video-room", { roomId, userId });
      } catch (err) {
        console.error("Media access error:", err);
      }
    };

    init();

    socket.on("user-list", (userList) => {
      userList.forEach((remoteId) => {
        if (remoteId !== userId && !peerConnections.current[remoteId]) {
          createPeerConnection(remoteId, userId > remoteId);
        }
      });
    });

    socket.on("user-joined", (remoteId) => {
      if (remoteId !== userId && !peerConnections.current[remoteId]) {
        createPeerConnection(remoteId, userId > remoteId);
      }
    });

    socket.on("offer", async ({ from, offer }) => {
      let pc = peerConnections.current[from];
      if (!pc) {
        createPeerConnection(from, false);
        pc = peerConnections.current[from];
      }

      if (pc.signalingState !== "stable") {
        console.warn(`Ignoring offer from ${from} in state ${pc.signalingState}`);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer, roomId });
    });

    socket.on("answer", async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") {
        console.warn(`Skipping answer from ${from}; unexpected state: ${pc.signalingState}`);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      try {
        await peerConnections.current[from]?.addIceCandidate(candidate);
      } catch (e) {
        console.error("ICE candidate error:", e);
      }
    });

    socket.on("user-left", (remoteId) => {
      if (peerConnections.current[remoteId]) {
        peerConnections.current[remoteId].close();
        delete peerConnections.current[remoteId];
        setRemoteStreams(prev => {
          const copy = { ...prev };
          delete copy[remoteId];
          return copy;
        });
      }
    });

    return () => {
      socket.off("user-list");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");

      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    };
  }, [isOpen, socket, roomId, userId]);

  const createPeerConnection = (remoteId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "efgh",
          credential: "5678"
        }
      ]
    });

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: remoteId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [remoteId]: event.streams[0]
      }));
    };

    peerConnections.current[remoteId] = pc;

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit("offer", {
            to: remoteId,
            offer: pc.localDescription,
            roomId
          });
        });
    }
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = !isVideoEnabled;
    });
    setIsVideoEnabled(prev => !prev);
  };

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = !isAudioEnabled;
    });
    setIsAudioEnabled(prev => !prev);
  };

  return (
    <div className="video-chat-container">
      <div className="video-container">
        <video ref={localVideoRef} autoPlay muted className="local-video" />
        {Object.entries(remoteStreams).map(([uid, stream]) => (
          <video
            key={uid}
            autoPlay
            ref={el => {
              if (el && !el.srcObject) el.srcObject = stream;
            }}
            className="remote-video"
          />
        ))}
      </div>
      <div className="controls">
        <button onClick={toggleVideo}>
          {isVideoEnabled ? "Hide Video" : "Show Video"}
        </button>
        <button onClick={toggleAudio}>
          {isAudioEnabled ? "Mute" : "Unmute"}
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
