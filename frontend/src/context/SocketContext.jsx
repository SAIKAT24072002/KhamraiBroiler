import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { baseApiUrl } from '../utils/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Determine backend base URL without /api
    const backendBaseUrl = baseApiUrl.replace(/\/api\/?$/, '');
    
    const newSocket = io(backendBaseUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Socket.IO Connected', newSocket.id);
      
      // If user is admin, automatically join admin room
      if (user && user.role === 'admin') {
        newSocket.emit('join_admin_room');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
