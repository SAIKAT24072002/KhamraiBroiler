// firebase.js – Firebase initialization and reCAPTCHA helper

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Export Auth instance
export const firebaseAuth = getAuth(firebaseApp);

/**
 * Sets up an invisible reCAPTCHA verifier bound to #recaptcha-container.
 * Call this before signInWithPhoneNumber().
 */
export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      firebaseAuth,
      'recaptcha-container',
      {
        size: 'invisible',
        callback: () => {},
      }
    );
  }
  return window.recaptchaVerifier;
};
