import React, { createContext, useContext, useState, useEffect } from 'react';
import { FestEvent } from '../types';
import { apiFetch } from '../services/api';
import { EVENTS_CATALOG } from '../data/eventsCatalog';

interface EventsContextType {
  events: FestEvent[];
  isLoading: boolean;
  refetchEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<FestEvent[]>(EVENTS_CATALOG);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: FestEvent[] }>('/events');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setEvents(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch events from API, falling back to static catalog.', err);
      setEvents(EVENTS_CATALOG);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <EventsContext.Provider value={{ events, isLoading, refetchEvents: fetchEvents }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
