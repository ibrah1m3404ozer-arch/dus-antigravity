// Paste this in browser console (F12) to check IndexedDB
import('idb').then(({ openDB }) => {
    openDB('DUS_Antigravity_ULTIMATE_v1', 3).then(db => {
        db.getAll('study_sessions').then(sessions => {
            console.log('📚 Study Sessions in IndexedDB:', sessions);
            console.log(`Total: ${sessions.length} sessions`);
        });
    });
});

// OR simpler version:
const request = indexedDB.open('DUS_Antigravity_ULTIMATE_v1', 3);
request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('study_sessions', 'readonly');
    const store = tx.objectStore('study_sessions');
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => {
        console.log('📚 Sessions:', getAllRequest.result);
    };
};
