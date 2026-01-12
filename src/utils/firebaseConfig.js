import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    console.warn('Persistence failed:', err.code);
});

// Auto sign-in anonymously
let currentUser = null;

const initAuth = async () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                resolve(user);
            } else {
                // Sign in anonymously if not signed in
                const userCredential = await signInAnonymously(auth);
                currentUser = userCredential.user;
                resolve(currentUser);
            }
        });
    });
};

export { db, auth, currentUser, initAuth };
