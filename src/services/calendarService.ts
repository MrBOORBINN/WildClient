import { getCachedAccessToken } from './authService';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

export const fetchUpcomingEvents = async (maxResults = 10): Promise<CalendarEvent[]> => {
  const token = getCachedAccessToken();
  if (!token) throw new Error('Not authenticated for Google Calendar');

  const now = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${now}&maxResults=${maxResults}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch calendar events');
  }

  const data = await res.json();
  return data.items || [];
};
