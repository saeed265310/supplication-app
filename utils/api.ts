import type { User, UserData, SupplicationGroup, Supplication } from '../types';

// The app is not using a build tool like Vite, so import.meta.env is undefined.
// Hardcode the API URL to the development server address.
const API_BASE_URL = 'http://localhost:3001/api';

const getAuthToken = () => {
  return localStorage.getItem('supplication_app_currentUserToken');
};

const setAuthToken = (token: string) => {
  localStorage.setItem('supplication_app_currentUserToken', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('supplication_app_currentUserToken');
};

const apiRequest = async <T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Handle responses that might not have a body (e.g., DELETE)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  } else {
    return null as T;
  }
};


// --- User Authentication ---

export const apiSignup = async (username: string, password: string): Promise<{ user: User }> => {
  const { user, token } = await apiRequest<{ user: User; token: string }>('/signup', 'POST', { username, password });
  setAuthToken(token);
  return { user };
};

export const apiLogin = async (username: string, password: string): Promise<{ user: User }> => {
  const { user, token } = await apiRequest<{ user: User; token: string }>('/login', 'POST', { username, password });
  setAuthToken(token);
  return { user };
};

export const apiLogout = async (): Promise<void> => {
  removeAuthToken();
  // In a real app, you might also call a backend endpoint to invalidate the token
  return Promise.resolve();
};

export const apiCheckAuth = async (): Promise<{ user: User } | null> => {
    const token = getAuthToken();
    if (!token) {
      return null;
    }
    try {
        return await apiRequest<{ user: User }>('/check-auth', 'GET');
    } catch (error) {
        console.warn("Auth check failed, token may be invalid.", error);
        removeAuthToken(); // Clean up invalid token
        return null;
    }
};


// --- User Data ---

export const apiGetUserData = (): Promise<UserData> => {
  return apiRequest<UserData>('/data', 'GET');
};

export const apiAddGroup = (name: string): Promise<SupplicationGroup> => {
  return apiRequest<SupplicationGroup>('/groups', 'POST', { name });
};

export const apiDeleteGroup = (groupId: string): Promise<void> => {
  return apiRequest<void>(`/groups/${groupId}`, 'DELETE');
};

export const apiAddSupplication = (groupId: string, text: string, target: number): Promise<Supplication> => {
  return apiRequest<Supplication>(`/supplications`, 'POST', { groupId, text, target });
};

export const apiUpdateSupplication = (supplicationId: string, updatedText: string, updatedTarget: number): Promise<Supplication> => {
  return apiRequest<Supplication>(`/supplications/${supplicationId}`, 'PUT', { text: updatedText, target: updatedTarget });
};

export const apiDeleteSupplication = (supplicationId: string): Promise<void> => {
  return apiRequest<void>(`/supplications/${supplicationId}`, 'DELETE');
};

export const apiIncrementCount = (supplicationId: string): Promise<Supplication> => {
  return apiRequest<Supplication>(`/supplications/${supplicationId}/increment`, 'POST');
};

export const apiResetCount = (supplicationId: string): Promise<Supplication> => {
  // Fix: Corrected the URL from a malformed string to a proper template literal.
  return apiRequest<Supplication>(`/supplications/${supplicationId}/reset`, 'POST');
};