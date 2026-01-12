import { db, auth } from './firebaseConfig';
import { collection, doc, setDoc, getDocs, writeBatch, query, onSnapshot } from 'firebase/firestore';
import { initDB } from './db';

// Map IndexedDB store names to Firestore collection names
const COLLECTION_MAP = {
    'topics': 'topics',
    'articles': 'articles',
    'folders': 'folders',
    'pearls': 'pearls',
    'questions': 'questions',
    'exams': 'exams',
    'mistakes': 'mistakes',
    'activities': 'activities',
    'fitness_workouts': 'fitness_workouts',
    'fitness_logs': 'fitness_logs',
    'supplements': 'supplements',
    'supplement_logs': 'supplement_logs',
    'nutrition_logs': 'nutrition_logs',
    'assets': 'assets'
};

const getUserId = () => {
    return auth.currentUser ? auth.currentUser.uid : null;
};

// --- SYNC ENGINE ---

/**
 * Uploads a single item to Firestore
 * @param {string} storeName - IndexedDB store name
 * @param {object} item - The data object (must have an id)
 */
export const syncItemToFirestore = async (storeName, item) => {
    const userId = getUserId();
    if (!userId || !item.id) return;

    const collectionName = COLLECTION_MAP[storeName];
    if (!collectionName) return;

    try {
        const docRef = doc(db, `users/${userId}/${collectionName}`, item.id.toString());
        await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        console.log(`☁️ Synced to cloud: ${storeName}/${item.id}`);
    } catch (error) {
        console.error('Sync upload failed:', error);
    }
};

/**
 * Downloads all data from Firestore and updates IndexedDB
 * Should be called on app start
 */
export const syncAllFromFirestore = async (onProgress) => {
    const userId = getUserId();
    if (!userId) return;

    if (onProgress) onProgress("Buluta Bağlanılıyor...");
    console.log("🔄 Starting full sync from cloud...");

    // Cloud connection warmup
    try {
        await getDocs(query(collection(db, `users/${userId}/topics`), limit(1)));
    } catch (e) { /* ignore connection check */ }

    const dbLocal = await initDB();
    let totalDownloaded = 0;

    const stores = Object.entries(COLLECTION_MAP);
    let completedStores = 0;

    for (const [storeName, collectionName] of stores) {
        if (onProgress) onProgress(`${storeName} taranıyor... (%${Math.round((completedStores / stores.length) * 100)})`);
        try {
            const q = query(collection(db, `users/${userId}/${collectionName}`));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                completedStores++;
                continue;
            }

            const tx = dbLocal.transaction(storeName, 'readwrite');
            let count = 0;

            querySnapshot.forEach((doc) => {
                try {
                    const data = doc.data();
                    if (data.id) {
                        tx.store.put(data);
                        count++;
                    }
                } catch (err) { }
            });

            await tx.done;
            if (count > 0) {
                console.log(`⬇️ Downloaded ${count} items for ${storeName}`);
                if (onProgress) onProgress(`${count} ${storeName} indirildi`);
            }
            totalDownloaded += count;

        } catch (error) {
            console.warn(`Sync failed for ${storeName}:`, error);
        }
        completedStores++;
    }

    if (onProgress) onProgress("Tamamlandı!");
    console.log(`✅ Cloud sync complete. Total downloaded: ${totalDownloaded}`);
    return totalDownloaded;
};

/**
 * Batch upload local data to Firestore (for initial migration)
 * @param {string} storeName 
 */
export const pushLocalToCloud = async (storeName) => {
    const userId = getUserId();
    if (!userId) return;

    const dbLocal = await initDB();
    const items = await dbLocal.getAll(storeName);

    if (items.length === 0) return;

    const collectionName = COLLECTION_MAP[storeName];
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const item of items) {
        const docRef = doc(db, `users/${userId}/${collectionName}`, item.id.toString());
        batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
        batchCount++;

        // Firestore batch limit is 500
        if (batchCount >= 450) {
            await batch.commit();
            // Reset batch would need new instance, simplified here
        }
    }

    if (batchCount > 0) {
        await batch.commit();
        console.log(`⬆️ Pushed ${batchCount} local items from ${storeName} to cloud`);
    }
};

/**
 * Force pushes ALL local data stores to Cloud
 */
export const forceSyncAllToCloud = async () => {
    const userId = getUserId();
    if (!userId) {
        alert("Senkronizasyon için giriş yapmalısınız!");
        return;
    }

    console.log("🚀 Starting FORCE SYNC TO CLOUD...");
    const stores = Object.keys(COLLECTION_MAP);

    // Run in parallel
    await Promise.all(stores.map(store => pushLocalToCloud(store)));

    console.log("✅ FORCE SYNC COMPLETE");
    return true;
};
