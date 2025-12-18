import axios from 'axios';
// import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Change this based on where you're testing
// If testing on physical iPhone: use your computer's local IP (192.168.0.x)
// If testing on simulator: use localhost


const API_URL = 'http://192.168.1.233:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// await SecureStore.setItemAsync('key', 'value');
//    const value = await SecureStore.getItemAsync('key');