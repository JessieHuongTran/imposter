import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : window.location.origin);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("toast", ({ message }) => {
      setToast(message);
      setTimeout(() => setToast(null), 4000);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Returns a promise that resolves with the connected socket
  const ensureConnected = useCallback(() => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket) return;

      if (socket.connected) {
        resolve(socket);
        return;
      }

      socket.connect();
      socket.once("connect", () => resolve(socket));
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        ensureConnected,
        disconnect,
        toast,
        dismissToast,
      }}
    >
      {children}
      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </SocketContext.Provider>
  );
}

function Toast({ message, onDismiss }) {
  return (
    <div
      onClick={onDismiss}
      className="fixed top-4 left-4 right-4 z-[100] bg-bg border-2 border-orange box-glow-orange rounded-lg p-4 text-orange font-body text-sm text-center cursor-pointer page-enter"
    >
      {message}
    </div>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be inside SocketProvider");
  return ctx;
}
