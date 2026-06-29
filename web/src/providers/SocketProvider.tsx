"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "../lib/socket";
import { Socket } from "socket.io-client";
import { useSession } from "./SessionProvider";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user) return;

        const s = getSocket();
        s.connect();
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
