import { db, initAuth } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';

// Initialize auth on module load
let authReady = initAuth();

// Collections
const COLLECTIONS = {
    TOPICS: 'topics',
    ASSETS: 'assets',
    ACTIVITIES: 'activities',
    RESOURCES: 'resources',
    POMODOROSETTINGS: 'pomodoroSettings',
    USERSETTINGS: 'userSettings'
};

// Generic CRUD operations
export const firebaseDB = {
    // Save document
    async save(collectionName, id, data) {
        await authReady;
        const docRef = doc(db, collectionName, String(id));
        await setDoc(docRef, { ...data, id, updatedAt: new Date().toISOString() }, { merge: true });
        return data;
    },

    // Get document by ID
    async get(collectionName, id) {
        await authReady;
        const docRef = doc(db, collectionName, String(id));
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },

    // Get all documents
    async getAll(collectionName) {
        await authReady;
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => doc.data());
    },

    // Delete document
    async delete(collectionName, id) {
        await authReady;
        await deleteDoc(doc(db, collectionName, String(id)));
    },

    // Batch save multiple documents
    async batchSave(collectionName, items) {
        await authReady;
        const batch = writeBatch(db);
        items.forEach(item => {
            const docRef = doc(db, collectionName, String(item.id));
            batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        });
        await batch.commit();
    },

    // Real-time listener
    subscribe(collectionName, callback) {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data());
            callback(data);
        }, (error) => {
            console.error('Firestore subscription error:', error);
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

export { COLLECTIONS };
