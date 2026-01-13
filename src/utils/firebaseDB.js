import { db, auth, initAuth } from './firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';

// Initialize auth and storage
let authReady = initAuth();
const storage = getStorage();

// Collections
const COLLECTIONS = {
    TOPICS: 'topics',
    ASSETS: 'assets',
    ACTIVITIES: 'activities',
    RESOURCES: 'resources',
    POMODOROSETTINGS: 'pomodoroSettings',
    USERSETTINGS: 'userSettings',
    // Library collections
    LIBRARY_ARTICLES: 'library_articles',
    LIBRARY_FOLDERS: 'library_folders',
    LIBRARY_PEARLS: 'library_pearls',
    LIBRARY_QUESTIONS: 'library_questions'
};

// Storage helpers for Library files
export const storageHelpers = {
    // Upload file to Firebase Storage
    async uploadFile(file, path) {
        await authReady;
        if (!auth.currentUser) throw new Error('User not authenticated');

        const storageRef = ref(storage, `${auth.currentUser.uid}/${path}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    },

    // Delete file from Storage
    async deleteFile(path) {
        await authReady;
        if (!auth.currentUser) return;

        const storageRef = ref(storage, `${auth.currentUser.uid}/${path}`);
        try {
            await deleteObject(storageRef);
        } catch (error) {
            console.warn('File delete failed:', error);
        }
    },

    // Download file from Storage (returns Blob)
    async downloadFile(url) {
        await authReady;
        if (!auth.currentUser) throw new Error('User not authenticated');

        const response = await fetch(url);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        return blob;
    }
};

// Generic CRUD operations
export const firebaseDB = {
    // Save document
    async save(collectionName, id, data) {
        await authReady;
        if (!auth.currentUser) {
            console.warn('Not authenticated - skipping Firebase save');
            return data;
        }

        const docRef = doc(db, `users/${auth.currentUser.uid}/${collectionName}`, String(id));
        await setDoc(docRef, { ...data, id, updatedAt: new Date().toISOString() }, { merge: true });
        return data;
    },

    // Get document by ID
    async get(collectionName, id) {
        await authReady;
        if (!auth.currentUser) return null;

        const docRef = doc(db, `users/${auth.currentUser.uid}/${collectionName}`, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },

    // Get all documents
    async getAll(collectionName) {
        await authReady;
        if (!auth.currentUser) return [];

        const querySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/${collectionName}`));
        return querySnapshot.docs.map(doc => doc.data());
    },

    // Delete document
    async delete(collectionName, id) {
        await authReady;
        if (!auth.currentUser) return;

        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/${collectionName}`, String(id)));
    },

    // Batch save multiple documents
    async batchSave(collectionName, items) {
        await authReady;
        if (!auth.currentUser || items.length === 0) return;

        const batch = writeBatch(db);
        items.forEach(item => {
            const docRef = doc(db, `users/${auth.currentUser.uid}/${collectionName}`, String(item.id));
            batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        });
        await batch.commit();
    },

    // Real-time listener
    subscribe(collectionName, callback) {
        authReady.then(() => {
            if (!auth.currentUser) {
                callback([]);
                return () => { };
            }

            const q = query(collection(db, `users/${auth.currentUser.uid}/${collectionName}`));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => doc.data());
                callback(data);
            }, (error) => {
                console.error('Firestore subscription error:', error);
            });
        });
    }
};

// Specific helpers for app collections
export const saveTopic = (topic) => firebaseDB.save(COLLECTIONS.TOPICS, topic.id, topic);
export const getTopic = (id) => firebaseDB.get(COLLECTIONS.TOPICS, id);
export const getAllTopics = () => firebaseDB.getAll(COLLECTIONS.TOPICS);
export const deleteTopic = (id) => firebaseDB.delete(COLLECTIONS.TOPICS, id);

export const saveAsset = (asset) => firebaseDB.save(COLLECTIONS.ASSETS, asset.id, asset);
export const getAsset = (id) => firebaseDB.get(COLLECTIONS.ASSETS, id);
export const getAllAssets = () => firebaseDB.getAll(COLLECTIONS.ASSETS);
export const deleteAsset = (id) => firebaseDB.delete(COLLECTIONS.ASSETS, id);

export const saveActivity = (activity) => firebaseDB.save(COLLECTIONS.ACTIVITIES, activity.id, activity);
export const getAllActivities = () => firebaseDB.getAll(COLLECTIONS.ACTIVITIES);

// Library-specific helpers
export const saveLibraryArticle = (article) => firebaseDB.save(COLLECTIONS.LIBRARY_ARTICLES, article.id, article);
export const getLibraryArticle = (id) => firebaseDB.get(COLLECTIONS.LIBRARY_ARTICLES, id);
export const getAllLibraryArticles = () => firebaseDB.getAll(COLLECTIONS.LIBRARY_ARTICLES);
export const deleteLibraryArticle = (id) => firebaseDB.delete(COLLECTIONS.LIBRARY_ARTICLES, id);

export const saveLibraryFolder = (folder) => firebaseDB.save(COLLECTIONS.LIBRARY_FOLDERS, folder.id, folder);
export const getAllLibraryFolders = () => firebaseDB.getAll(COLLECTIONS.LIBRARY_FOLDERS);
export const deleteLibraryFolder = (id) => firebaseDB.delete(COLLECTIONS.LIBRARY_FOLDERS, id);

export const saveLibraryPearl = (pearl) => firebaseDB.save(COLLECTIONS.LIBRARY_PEARLS, pearl.id, pearl);
export const getAllLibraryPearls = () => firebaseDB.getAll(COLLECTIONS.LIBRARY_PEARLS);
export const deleteLibraryPearl = (id) => firebaseDB.delete(COLLECTIONS.LIBRARY_PEARLS, id);

export const saveLibraryQuestion = (question) => firebaseDB.save(COLLECTIONS.LIBRARY_QUESTIONS, question.id, question);
export const getAllLibraryQuestions = () => firebaseDB.getAll(COLLECTIONS.LIBRARY_QUESTIONS);
export const deleteLibraryQuestion = (id) => firebaseDB.delete(COLLECTIONS.LIBRARY_QUESTIONS, id);

export { COLLECTIONS, storage };

// Study Sessions Listener
export const listenToStudySessions = (callback) => {
    const listener = async () => {
        await authReady;

        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            // Anonymous users: load from IndexedDB
            const { getStudySessions } = await import('./db');
            const sessions = await getStudySessions();
            callback(sessions);

            // Return a no-op unsubscribe
            return () => { };
        }

        const q = query(
            collection(db, `users/${auth.currentUser.uid}/study_sessions`),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(sessions);
        }, (error) => {
            console.error('Study sessions listener error:', error);
            callback([]);
        });

        return unsubscribe;
    };

    return listener();
};
