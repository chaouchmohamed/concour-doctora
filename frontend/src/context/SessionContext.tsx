import React, { createContext, useContext, useState, ReactNode } from "react";

interface Session {
  id: number;
  name: string;
  year: number;
  status: string;
}

interface SessionContextType {
  selectedSession: Session | null;
  setSelectedSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <SessionContext.Provider value={{ selectedSession, setSelectedSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
