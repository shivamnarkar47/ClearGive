import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if all required Firebase config values are present
const requiredConfig = ['apiKey', 'authDomain', 'projectId'] as const;
for (const key of requiredConfig) {
  if (!firebaseConfig[key]) {
    throw new Error(`Firebase ${key} is required but not provided`);
  }
}

let auth: Auth;

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth }; 