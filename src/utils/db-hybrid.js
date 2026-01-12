// Hybrid DB Layer: IndexedDB (local) + Firebase (cloud sync)
import { openDB } from 'idb';
import { firebaseDB, COLLECTIONS } from './firebaseDB';

const DB_NAME = 'DUS_Antigravity_ULTIMATE_v1';
const DB_VERSION = 3;

// Store names
const STORE_NAME = 'topics';
const ARTICLE_STORE = 'articles';
const FOLDER_STORE = 'folders';
const PEARL_STORE = 'pearls';
const PEARL_FOLDER_STORE = 'pearl_folders';
const QUESTION_STORE = 'questions';
const EXAM_STORE = 'exams';
const MISTAKE_STORE = 'mistakes';
const ACTIVITY_STORE = 'activities';
const STUDY_SESSION_STORE = 'study_sessions';
const FITNESS_WORKOUT_STORE = 'fitness_workouts';
const FITNESS_LOG_STORE = 'fitness_logs';
const SUPPLEMENT_STORE = 'supplements';
const SUPPLEMENT_LOG_STORE = 'supplement_logs';
export const NUTRITION_STORE = 'nutrition_logs';
const ASSET_STORE = 'assets';
const RESOURCE_STORE = 'resources';
const POMODORO_SETTINGS_STORE = 'pomodoro_settings';
const USER_SETTINGS_STORE = 'user_settings';

let dbPromise = null;
let firebaseSyncEnabled = true; // Toggle for Firebase sync

// Initialize IndexedDB
export const initDB = async () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`DB Upgrade: ${oldVersion} -> ${newVersion}`);

                // Create all stores if they don't exist
                const stores = [
                    STORE_NAME, ARTICLE_STORE, FOLDER_STORE, PEARL_STORE,
                    PEARL_FOLDER_STORE, QUESTION_STORE, EXAM_STORE, MISTAKE_STORE,
                    ACTIVITY_STORE, STUDY_SESSION_STORE, FITNESS_WORKOUT_STORE,
                    FITNESS_LOG_STORE, SUPPLEMENT_STORE, SUPPLEMENT_LOG_STORE,
                    NUTRITION_STORE, ASSET_STORE, RESOURCE_STORE,
                    POMODORO_SETTINGS_STORE, USER_SETTINGS_STORE
                ];

                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            }
        });
    }
    return dbPromise;
};

// Hybrid save: IndexedDB + Firebase
async function hybridSave(storeName, data) {
    const db = await initDB();
    await db.put(storeName, data);

    // Sync to Firebase if enabled
    if (firebaseSyncEnabled) {
        try {
            const firestoreCollection = mapStoreToCollection(storeName);
            if (firestoreCollection) {
                await firebaseDB.save(firestoreCollection, data.id, data);
            }
        } catch (err) {
            console.warn('Firebase sync failed (offline?):', err);
        }
    }
    return data;
}

// Hybrid get: Try IndexedDB first, fallback to Firebase
async function hybridGet(storeName, id) {
    const db = await initDB();
    let data = await db.get(storeName, id);

    if (!data && firebaseSyncEnabled) {
        try {
            const firestoreCollection = mapStoreToCollection(storeName);
            if (firestoreCollection) {
                data = await firebaseDB.get(firestoreCollection, id);
                if (data) {
                    await db.put(storeName, data); // Cache locally
                }
            }
        } catch (err) {
            console.warn('Firebase fetch failed:', err);
        }
    }
    return data;
}

// Hybrid getAll: Merge local + cloud
async function hybridGetAll(storeName) {
    const db = await initDB();
    let localData = await db.getAll(storeName);

    if (firebaseSyncEnabled) {
        try {
            const firestoreCollection = mapStoreToCollection(storeName);
            if (firestoreCollection) {
                const cloudData = await firebaseDB.getAll(firestoreCollection);

                // Merge: prefer cloud data (newer updatedAt)
                const merged = new Map();
                localData.forEach(item => merged.set(item.id, item));
                cloudData.forEach(item => {
                    const existing = merged.get(item.id);
                    if (!existing || (item.updatedAt && item.updatedAt > (existing.updatedAt || ''))) {
                        merged.set(item.id, item);
                    }
                });

                return Array.from(merged.values());
            }
        } catch (err) {
            console.warn('Firebase sync failed:', err);
        }
    }
    return localData;
}

// Hybrid delete
async function hybridDelete(storeName, id) {
    const db = await initDB();
    await db.delete(storeName, id);

    if (firebaseSyncEnabled) {
        try {
            const firestoreCollection = mapStoreToCollection(storeName);
            if (firestoreCollection) {
                await firebaseDB.delete(firestoreCollection, id);
            }
        } catch (err) {
            console.warn('Firebase delete failed:', err);
        }
    }
}

// Map IndexedDB store names to Firestore collections
function mapStoreToCollection(storeName) {
    const mapping = {
        [STORE_NAME]: COLLECTIONS.TOPICS,
        [ASSET_STORE]: COLLECTIONS.ASSETS,
        [ACTIVITY_STORE]: COLLECTIONS.ACTIVITIES,
        [RESOURCE_STORE]: COLLECTIONS.RESOURCES,
        [POMODORO_SETTINGS_STORE]: COLLECTIONS.POMODOROSETTINGS,
        [USER_SETTINGS_STORE]: COLLECTIONS.USERSETTINGS
    };
    return mapping[storeName] || null;
}

// Export all existing functions as hybrid versions
export const saveTopic = (topic) => hybridSave(STORE_NAME, topic);
export const getTopic = (id) => hybridGet(STORE_NAME, id);
export const getAllTopicData = () => hybridGetAll(STORE_NAME);
export const deleteTopic = (id) => hybridDelete(STORE_NAME, id);

export const saveAsset = (asset) => hybridSave(ASSET_STORE, asset);
export const getAssets = () => hybridGetAll(ASSET_STORE);
export const deleteAsset = (id) => hybridDelete(ASSET_STORE, id);

export const saveActivity = (activity) => hybridSave(ACTIVITY_STORE, activity);
export const getAllActivities = () => hybridGetAll(ACTIVITY_STORE);

export const saveResource = (resource) => hybridSave(RESOURCE_STORE, resource);
export const getResource = (id) => hybridGet(RESOURCE_STORE, id);
export const getAllResources = () => hybridGetAll(RESOURCE_STORE);
export const deleteResource = (id) => hybridDelete(RESOURCE_STORE, id);

// Re-export original IndexedDB-only functions for stores not yet synced
export {
    STORE_NAME, ARTICLE_STORE, FOLDER_STORE, PEARL_STORE,
    PEARL_FOLDER_STORE, QUESTION_STORE, EXAM_STORE, MISTAKE_STORE,
    STUDY_SESSION_STORE, FITNESS_WORKOUT_STORE, FITNESS_LOG_STORE,
    SUPPLEMENT_STORE, SUPPLEMENT_LOG_STORE, ASSET_STORE, RESOURCE_STORE,
    POMODORO_SETTINGS_STORE, USER_SETTINGS_STORE
};

// Original exports remain unchanged for backward compatibility
export const resetDB = async () => {
    if (confirm('Tüm verileri sil?')) {
        await initDB();
        // Clear all stores
    }
};

export { initDB as default };
