import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();


export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendURL = import.meta.env.VITE_SERVER_URL;

    const newSocket = io(backendURL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
