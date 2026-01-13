import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDiQ-kFbhQeEtrT7AAa2p68RU3I3t2OlTo",
    authDomain: "lifeos-5b51a.firebaseapp.com",
    projectId: "lifeos-5b51a",
    storageBucket: "lifeos-5b51a.firebasestorage.app",
    messagingSenderId: "424001037847",
    appId: "1:424001037847:web:0c776ee054aecf2e251e52",
    measurementId: "G-SV5XQRG1CE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    console.warn('Persistence failed:', err.code);
});

// Auth Helpers
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
    window.location.reload(); // Reload to reset state
};

// Auth State Observer
let currentUser = null;

const initAuth = async () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                resolve(user);
            } else {
                // DO NOT auto sign-in anonymously if we want explicit login
                // But for backward compatibility/trial, we keep it OR make it optional.
                // For now, let's keep anonymous fallback so app works immediately
                const userCredential = await signInAnonymously(auth);
                currentUser = userCredential.user;
                resolve(currentUser);
            }
        });
    });
};

export { db, auth, storage, currentUser, initAuth };
