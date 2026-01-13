import { openDB } from 'idb';
import { saveLibraryArticle, deleteLibraryArticle, saveLibraryFolder, deleteLibraryFolder, saveLibraryPearl, deleteLibraryPearl, saveLibraryQuestion, deleteLibraryQuestion, storageHelpers } from './firebaseDB';
import { auth } from './firebaseConfig';
import { syncItemToFirestore } from './sync';

const DB_NAME = 'DUS_Antigravity_ULTIMATE_v1';
const DB_VERSION = 3; // Bumped to 3

// --- Constants ---
const STORE_NAME = 'topics';
const ARTICLE_STORE = 'articles';
const FOLDER_STORE = 'folders';
const PEARL_STORE = 'pearls';
const PEARL_FOLDER_STORE = 'pearl_folders';
const QUESTION_STORE = 'questions';
const EXAM_STORE = 'exams';
const MISTAKE_STORE = 'mistakes';
const ACTIVITY_STORE = 'activities';
const STUDY_SESSION_STORE = 'study_sessions'; // New Store

const FITNESS_WORKOUT_STORE = 'fitness_workouts';
const FITNESS_LOG_STORE = 'fitness_logs';
const SUPPLEMENT_STORE = 'supplements';
const SUPPLEMENT_LOG_STORE = 'supplement_logs';
export const NUTRITION_STORE = 'nutrition_logs';
const ASSET_STORE = 'assets';

let dbPromise = null;

// --- Init DB ---
export const initDB = async () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`DB Upgrade: ${oldVersion} -> ${newVersion}`);

                // Core DUS Stores
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(ARTICLE_STORE)) db.createObjectStore(ARTICLE_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(FOLDER_STORE)) db.createObjectStore(FOLDER_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(PEARL_STORE)) db.createObjectStore(PEARL_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(PEARL_FOLDER_STORE)) db.createObjectStore(PEARL_FOLDER_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(QUESTION_STORE)) db.createObjectStore(QUESTION_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(EXAM_STORE)) db.createObjectStore(EXAM_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(MISTAKE_STORE)) db.createObjectStore(MISTAKE_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(ACTIVITY_STORE)) db.createObjectStore(ACTIVITY_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STUDY_SESSION_STORE)) db.createObjectStore(STUDY_SESSION_STORE, { keyPath: 'id' }); // New Store

                // Fitness Stores
                if (!db.objectStoreNames.contains(FITNESS_WORKOUT_STORE)) db.createObjectStore(FITNESS_WORKOUT_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(FITNESS_LOG_STORE)) db.createObjectStore(FITNESS_LOG_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(SUPPLEMENT_STORE)) db.createObjectStore(SUPPLEMENT_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(SUPPLEMENT_LOG_STORE)) db.createObjectStore(SUPPLEMENT_LOG_STORE, { keyPath: 'id' });

                // Nutrition Store
                if (!db.objectStoreNames.contains(NUTRITION_STORE)) db.createObjectStore(NUTRITION_STORE, { keyPath: 'id' });

                // Finance Store
                if (!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE, { keyPath: 'id' });
            },
            blocked() {
                alert("Veritabanı başlatılamadı! Lütfen diğer sekmeleri kapatın.");
            }
        });
    }
    return dbPromise;
};

// --- DUS & Core Helpers ---

export const getAllTopicData = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};
export const getTopicData = async (id) => {
    const db = await initDB();
    return db.get(STORE_NAME, id);
};
export const updateTopicData = async (data) => {
    const db = await initDB();
    await db.put(STORE_NAME, data);
    await syncItemToFirestore(STORE_NAME, data);
    return data;
};

// Image Helpers
export const saveTopicImage = async (topicId, imageFile, caption) => {
    try {
        const db = await initDB();
        const topic = (await db.get(STORE_NAME, topicId)) || { id: topicId, status: 'not-started', note: '', images: [] };
        if (!topic.images) topic.images = [];

        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(imageFile);
        });

        const newImage = {
            id: Date.now().toString(),
            dataUrl: base64,
            caption: caption || '',
            createdAt: new Date().toISOString()
        };

        topic.images.push(newImage);
        await db.put(STORE_NAME, topic);
        await syncItemToFirestore(STORE_NAME, topic);
        return topic;
    } catch (error) {
        console.error('Error saving image:', error);
        throw error;
    }
};

export const deleteTopicImage = async (topicId, imageId) => {
    try {
        const db = await initDB();
        const topic = await db.get(STORE_NAME, topicId);
        if (topic && topic.images) {
            topic.images = topic.images.filter(img => img.id !== imageId);
            await db.put(STORE_NAME, topic);
            return topic;
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

// Article Helpers
export const getAllArticles = async () => {
    const db = await initDB();
    return db.getAll(ARTICLE_STORE);
};
export const saveArticle = async (article) => {
    const db = await initDB();
    await db.put(ARTICLE_STORE, article);

    // Sync to Firebase
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
            console.log('🔄 SAVE ARTICLE SYNC:', {
                id: article.id,
                hasFileBlob: article.fileBlob instanceof Blob,
                hasFileURL: !!article.fileURL,
                hasAudioFile: article.audioFile instanceof Blob,
                hasAudioURL: !!article.audioURL
            });

            // ✅ FIXED: Only upload if we have a Blob AND no URL yet
            const fileURL = article.fileURL
                ? article.fileURL  // Use existing URL
                : article.fileBlob instanceof Blob
                    ? await storageHelpers.uploadFile(article.fileBlob, `articles/${article.id}/file.pdf`)
                    : null;

            const audioURL = article.audioURL
                ? article.audioURL  // Use existing URL  
                : article.audioFile instanceof Blob
                    ? await storageHelpers.uploadFile(article.audioFile, `articles/${article.id}/audio.mp3`)
                    : null;

            const videoURL = article.videoURL
                ? article.videoURL  // Use existing URL
                : article.videoFile instanceof Blob
                    ? await storageHelpers.uploadFile(article.videoFile, `articles/${article.id}/video.mp4`)
                    : null;

            console.log('🔥 SYNC URLs:', { fileURL, audioURL, videoURL });

            await saveLibraryArticle({
                id: article.id,
                title: article.title,
                category: article.category,
                content: article.content,
                summary: article.summary,
                createdAt: article.createdAt,
                folderId: article.folderId,
                fileURL, audioURL, videoURL,
                aiSummary: article.aiSummary,
                generatedFlashcards: article.generatedFlashcards,
                generatedQuizSets: article.generatedQuizSets
            });
            console.log('✅ SYNC COMPLETE with fileURL:', fileURL);
        } catch (err) {
            console.warn('Firebase sync error:', err);
        }
    }

    return article;
};
export const deleteArticle = async (id) => {
    const db = await initDB();
    await db.delete(ARTICLE_STORE, id);

    if (auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
            await Promise.all([
                storageHelpers.deleteFile(`articles/${id}/file.pdf`),
                storageHelpers.deleteFile(`articles/${id}/audio.mp3`),
                storageHelpers.deleteFile(`articles/${id}/video.mp4`),
                deleteLibraryArticle(id)
            ]);
        } catch (err) {
            console.warn('Firebase delete error:', err);
        }
    }
};

// Folder Helpers
export const createFolder = async (name) => {
    const db = await initDB();
    const newFolder = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
    await db.put(FOLDER_STORE, newFolder);

    // Sync to Firebase
    try {
        const { saveLibraryFolder } = await import('./firebaseDB');
        await saveLibraryFolder(newFolder);
    } catch (error) {
        console.warn('Firebase folder sync failed:', error);
    }

    return newFolder;
};
export const getFolders = async () => {
    const db = await initDB();
    return db.getAll(FOLDER_STORE);
};
export const deleteFolder = async (id) => {
    const db = await initDB();
    await db.delete(FOLDER_STORE, id);

    // Delete from Firebase
    try {
        const { deleteLibraryFolder } = await import('./firebaseDB');
        await deleteLibraryFolder(id);
    } catch (error) {
        console.warn('Firebase folder delete failed:', error);
    }
};

// Pearl (Hap Bilgi) Helpers
export const savePearl = async (pearl) => {
    const db = await initDB();
    await db.put(PEARL_STORE, pearl);

    // Sync to Firebase
    try {
        const { saveLibraryPearl } = await import('./firebaseDB');
        await saveLibraryPearl(pearl);
    } catch (error) {
        console.warn('Firebase pearl sync failed:', error);
    }

    return pearl;
};
export const getPearls = async () => {
    const db = await initDB();
    return db.getAll(PEARL_STORE);
};
export const togglePearlFavorite = async (id) => {
    const db = await initDB();
    const pearl = await db.get(PEARL_STORE, id);
    if (pearl) {
        pearl.isFavorite = !pearl.isFavorite;
        await db.put(PEARL_STORE, pearl);
    }
    return pearl;
};
export const deletePearl = async (id) => {
    const db = await initDB();
    await db.delete(PEARL_STORE, id);

    // Delete from Firebase
    try {
        const { deleteLibraryPearl } = await import('./firebaseDB');
        await deleteLibraryPearl(id);
    } catch (error) {
        console.warn('Firebase pearl delete failed:', error);
    }
};

export const createPearlFolder = async (folder) => {
    const db = await initDB();
    return db.put(PEARL_FOLDER_STORE, folder);
};
export const getPearlFolders = async () => {
    const db = await initDB();
    return db.getAll(PEARL_FOLDER_STORE);
};
export const deletePearlFolder = async (id) => {
    const db = await initDB();
    return db.delete(PEARL_FOLDER_STORE, id);
};

// Question Helpers
export const saveQuestion = async (question) => {
    const db = await initDB();
    await db.put(QUESTION_STORE, question);

    // Sync to Firebase
    try {
        const { saveLibraryQuestion } = await import('./firebaseDB');
        await saveLibraryQuestion(question);
    } catch (error) {
        console.warn('Firebase question sync failed:', error);
    }

    return question;
};
export const getQuestions = async () => {
    const db = await initDB();
    return db.getAll(QUESTION_STORE);
};
export const deleteQuestion = async (id) => {
    const db = await initDB();
    await db.delete(QUESTION_STORE, id);

    // Delete from Firebase
    try {
        const { deleteLibraryQuestion } = await import('./firebaseDB');
        await deleteLibraryQuestion(id);
    } catch (error) {
        console.warn('Firebase question delete failed:', error);
    }
};

// Exam Helpers
export const saveExam = async (exam) => {
    const db = await initDB();
    return db.put(EXAM_STORE, exam);
};
export const getExams = async () => {
    const db = await initDB();
    return db.getAll(EXAM_STORE);
};
export const deleteExam = async (id) => {
    const db = await initDB();
    return db.delete(EXAM_STORE, id);
};

// Mistake Helpers
export const saveMistake = async (m) => {
    const db = await initDB();
    return db.put(MISTAKE_STORE, m);
};
export const getMistakes = async () => {
    const db = await initDB();
    return db.getAll(MISTAKE_STORE);
};
export const deleteMistake = async (id) => {
    const db = await initDB();
    return db.delete(MISTAKE_STORE, id);
};

// Activity Helpers
export const saveActivity = async (a) => {
    const db = await initDB();
    return db.put(ACTIVITY_STORE, a);
};
export const getActivities = async () => {
    const db = await initDB();
    return db.getAll(ACTIVITY_STORE);
};
export const getActivitiesByDate = async (date) => {
    const db = await initDB();
    const allActivities = await db.getAll(ACTIVITY_STORE);
    const targetDate = new Date(date).toISOString().split('T')[0];
    return allActivities.filter(act => {
        const actDate = new Date(act.startTime).toISOString().split('T')[0];
        return actDate === targetDate;
    });
};

export const getActivitiesByCategory = async (cat) => {
    const db = await initDB();
    const all = await db.getAll(ACTIVITY_STORE);
    return all.filter(a => a.mainCategory === cat);
};
export const deleteActivity = async (id) => {
    const db = await initDB();
    return db.delete(ACTIVITY_STORE, id);
};

// --- Study Session Helpers (Pomodoro) ---
export const saveStudySession = async (session) => {
    const db = await initDB();
    const result = await db.put(STUDY_SESSION_STORE, session);

    // Dispatch event for realtime updates in Dashboard
    window.dispatchEvent(new Event('study-session-saved'));

    return result;
};
export const getStudySessions = async () => {
    const db = await initDB();
    return db.getAll(STUDY_SESSION_STORE);
};
export const deleteStudySession = async (id) => {
    const db = await initDB();
    await db.delete(STUDY_SESSION_STORE, id);

    // Also delete from Firestore if logged in
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            const { db: firestoreDb } = await import('./firebaseConfig');
            await deleteDoc(doc(firestoreDb, `users/${auth.currentUser.uid}/study_sessions`, id));
        } catch (error) {
            console.warn('Failed to delete from Firestore:', error);
        }
    }
};

// --- Fitness Helpers ---
export const getFitnessWorkouts = async () => {
    const db = await initDB();
    return db.getAll(FITNESS_WORKOUT_STORE);
};
export const saveFitnessWorkout = async (w) => {
    const db = await initDB();
    return db.put(FITNESS_WORKOUT_STORE, w);
};
export const getFitnessLogs = async () => {
    const db = await initDB();
    return db.getAll(FITNESS_LOG_STORE);
};
export const saveFitnessLog = async (l) => {
    const db = await initDB();
    return db.put(FITNESS_LOG_STORE, l);
};
export const deleteFitnessLog = async (id) => {
    const db = await initDB();
    const tx = db.transaction(FITNESS_LOG_STORE, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
};

// --- Supplement Helpers ---
export const getSupplements = async () => {
    const db = await initDB();
    return db.getAll(SUPPLEMENT_STORE);
};
export const saveSupplement = async (s) => {
    const db = await initDB();
    return db.put(SUPPLEMENT_STORE, s);
};
export const deleteSupplement = async (id) => {
    const db = await initDB();
    return db.delete(SUPPLEMENT_STORE, id);
};
export const getSupplementLogs = async () => {
    const db = await initDB();
    return db.getAll(SUPPLEMENT_LOG_STORE);
};
export const getSupplementLogsByDate = async (date) => {
    const db = await initDB();
    const allLogs = await db.getAll(SUPPLEMENT_LOG_STORE);
    return allLogs.filter(log => log.date === date);
};
export const saveSupplementLog = async (l) => {
    const db = await initDB();
    return db.put(SUPPLEMENT_LOG_STORE, l);
};
export const deleteSupplementLog = async (id) => {
    const db = await initDB();
    return db.delete(SUPPLEMENT_LOG_STORE, id);
};

// --- Nutrition Helpers ---
export const getNutritionLogs = async () => {
    const db = await initDB();
    return db.getAll(NUTRITION_STORE);
};
export const saveNutritionLog = async (l) => {
    const db = await initDB();
    return db.put(NUTRITION_STORE, l);
};
export const deleteNutritionLog = async (id) => {
    const db = await initDB();
    const tx = db.transaction(NUTRITION_STORE, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
};

// --- Utilities ---
export const resetDB = async () => {
    return new Promise((resolve, reject) => {
        const req = window.indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => { window.location.reload(); resolve(); };
        req.onerror = (e) => reject(e);
        req.onblocked = () => alert("Sıfırlama engellendi! Diğer sekmeleri kapatın.");
    });
};

export const migrateFromLocalStorage = async (currentData) => {
    const db = await initDB();
    const count = await db.count(STORE_NAME);

    if (count === 0 && currentData && currentData.length > 0) {
        console.log('Migrating data from LocalStorage to IndexedDB...');
        const tx = db.transaction(STORE_NAME, 'readwrite');

        for (const group of currentData) {
            for (const subject of group.subjects) {
                for (const topic of subject.topics) {
                    if (topic.status !== 'not-started' || topic.note || topic.questionCount > 0) {
                        try {
                            await tx.store.put({
                                id: topic.id,
                                title: topic.title,
                                status: topic.status || 'not-started',
                                note: topic.note || '',
                                questionCount: topic.questionCount || 0,
                                images: []
                            });
                        } catch (e) {
                            console.warn("Topic migration skipped:", topic.id);
                        }
                    }
                }
            }
        }
        await tx.done;
        return true;
    }
    return false;
};

// --- Finance / Asset Helpers ---
export const getAssets = async () => {
    const db = await initDB();
    return db.getAll(ASSET_STORE);
};

export const saveAsset = async (asset) => {
    const db = await initDB();
    return db.put(ASSET_STORE, asset);
};

export const deleteAsset = async (id) => {
    const db = await initDB();
    return db.delete(ASSET_STORE, id);
};
