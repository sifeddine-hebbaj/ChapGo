import { Platform } from 'react-native';
import { getToken, clearToken } from '@/lib/auth';

// Re-export getToken so it can be imported from this module
export { getToken };

// Get the appropriate host based on the platform
const getApiHost = (): string => {
  if (__DEV__) {
    // For development, use localhost or your computer's IP for physical devices
    return Platform.select({
      android: '10.0.2.2',  // Android emulator
      ios: 'localhost',     // For iOS simulator
      default: 'localhost', // Web and other platforms
    }) || 'localhost';
  }

  // For production, use your production API URL
  return 'your-production-api.com';
};

const API_HOST = getApiHost();
const API_PROTOCOL = __DEV__ ? 'http' : 'https';
const WS_PROTOCOL = __DEV__ ? 'ws' : 'wss';

// For WebSocket, we need to use the same host as the API for CORS
const WS_HOST = __DEV__ ? 'localhost' : API_HOST;

export const BASE_URL = `${API_PROTOCOL}://${API_HOST}${__DEV__ ? ':8080' : ''}`;
// For WebSocket, we need to use the correct WebSocket protocol and path
export const WS_URL = `${WS_PROTOCOL}://${WS_HOST}${__DEV__ ? ':8080' : ''}/ws`;

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    await clearToken();
  }
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    await clearToken();
  }
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    await clearToken();
  }
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}
