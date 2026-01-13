import { useState, useEffect } from 'react';
import { INITIAL_CURRICULUM } from '../utils/data';
import {
    migrateFromLocalStorage,
    getAllTopicData, updateTopicData, saveTopicImage, deleteTopicImage,
    getAllArticles, saveArticle,
    getFolders, createFolder,
    getPearls, savePearl,
    getQuestions, saveQuestion,
    getExams, saveExam,
    getMistakes, saveMistake,
    getActivities, saveActivity,
    getFitnessWorkouts, saveFitnessWorkout,
    getFitnessLogs, saveFitnessLog,
    getSupplements, saveSupplement,
    getSupplementLogs, saveSupplementLog,
    getNutritionLogs, saveNutritionLog,
    initDB
} from '../utils/db';
import { syncAllFromFirestore, pushLocalToCloud } from '../utils/sync';
import { initAuth } from '../utils/supabaseConfig';

const STORAGE_KEY = 'dus-antigravity-data';

export function useStudyData() {
    const [data, setData] = useState(INITIAL_CURRICULUM);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load & Migration
    useEffect(() => {
        const initializeData = async () => {
            try {
                // 0. Ensure Auth & Cloud Sync
                await initAuth();
                await syncAllFromFirestore();

                // Legacy Migration
                // Legacy Migration
                const localStr = localStorage.getItem(STORAGE_KEY);
                if (localStr) {
                    try {
                        const localData = JSON.parse(localStr);
                        await migrateFromLocalStorage(localData);
                        localStorage.setItem(STORAGE_KEY + '_migrated', localStr);
                        localStorage.removeItem(STORAGE_KEY);
                    } catch (err) { console.error('Migration error:', err); }
                }

                // Load Data
                let dbRecords = await getAllTopicData();

                // --- AUTO SEEDING LOGIC ---
                // If database is empty, seed it with INITIAL_CURRICULUM
                if (dbRecords.length === 0) {
                    console.log("⚠️ Database empty! Seeding Initial Curriculum topics...");
                    const batchSeed = [];

                    INITIAL_CURRICULUM.forEach(group => {
                        group.subjects.forEach(subject => {
                            subject.topics.forEach(topic => {
                                batchSeed.push({
                                    ...topic,
                                    subjectId: subject.id,
                                    groupId: group.id,
                                    lastUpdated: new Date().toISOString()
                                });
                            });
                        });
                    });

                    // Execute Seed
                    await Promise.all(batchSeed.map(t => updateTopicData(t)));
                    // Push seeded data to cloud immediately
                    await pushLocalToCloud('topics');
                    console.log(`✅ Seeding Complete: ${batchSeed.length} topics inserted.`);

                    // Reload seeded records
                    dbRecords = await getAllTopicData();
                }

                // Create Map with String keys to avoid Type mismatch
                const dbMap = new Map(dbRecords.map(item => [String(item.id), item]));

                const mergedData = INITIAL_CURRICULUM.map(group => ({
                    ...group,
                    subjects: group.subjects.map(subject => ({
                        ...subject,
                        topics: subject.topics.map(topic => {
                            const saved = dbMap.get(String(topic.id));
                            return saved ? {
                                ...topic, // Keep static data (title etc)
                                ...saved // Overwrite with dynamic data (status, note, images)
                            } : { ...topic, images: [] };
                        })
                    }))
                }));

                setData(mergedData);
            } catch (error) {
                console.error('Failed to initialize:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Listen for Global Sync Events (triggered by Sidebar auto-sync)
        const handleDbSync = () => {
            console.log("♻️ Data refresh triggered by Sync");
            initializeData();
        };

        window.addEventListener('db-synced', handleDbSync);
        initializeData();

        return () => window.removeEventListener('db-synced', handleDbSync);
    }, []);

    // ... Topic Helpers ... 
    const updateTopicStatus = async (topicId, newStatus) => {
        setData(prev => prev.map(g => ({
            ...g, subjects: g.subjects.map(s => ({
                ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, status: newStatus } : t)
            }))
        })));
        const topic = await getTopicFromList(topicId);
        if (topic) await updateTopicData({ ...topic, status: newStatus });
    };

    const updateTopicNote = async (topicId, note) => {
        setData(prev => prev.map(g => ({
            ...g, subjects: g.subjects.map(s => ({
                ...s, topics: s.topics.map(t => t.id === topicId ? { ...t, note } : t)
            }))
        })));
        const topic = await getTopicFromList(topicId);
        if (topic) await updateTopicData({ ...topic, note });
    };

    const addImage = async (topicId, file, caption) => {
        await saveTopicImage(topicId, file, caption);
        window.location.reload();
    };

    const removeImage = async (topicId, imageId) => {
        await deleteTopicImage(topicId, imageId);
        window.location.reload();
    };

    // Helper to get current state of a topic for DB saving
    const getTopicFromList = async (topicId) => {
        // We need to fetch from DB to be safe about existing properties
        const dbRecords = await getAllTopicData();
        return dbRecords.find(t => t.id === topicId)
            || { id: topicId, status: 'not-started', note: '', images: [] }; // Default fallback
    };


    // --- ROBUST EXPORT FUNCTION ---
    const exportData = async () => {
        try {
            console.log("Starting Full Export...");

            // 1. Fetch EVERYTHING
            const [
                topics,
                articles,
                folders,
                pearls,
                questions,
                exams,
                mistakes,
                activities,
                workouts,
                fitnessLogs,
                supplements,
                logs,
                nutrition
            ] = await Promise.all([
                getAllTopicData(),
                getAllArticles(),
                getFolders(),
                getPearls(),
                getQuestions(),
                getExams(),
                getMistakes(),
                getActivities(),
                getFitnessWorkouts(),
                getFitnessLogs(),
                getSupplements(),
                getSupplementLogs(),
                getNutritionLogs()
            ]);

            // 2. Structure Backup
            const backupPayload = {
                metadata: {
                    version: '2.0',
                    appName: 'DUS-Antigravity',
                    exportedAt: new Date().toISOString()
                },
                data: {
                    topics,
                    articles,
                    folders,
                    pearls,
                    questions,
                    exams,
                    mistakes,
                    activities,
                    workouts,
                    fitnessLogs,
                    supplements,
                    supplementLogs: logs,
                    nutritionLogs: nutrition
                }
            };

            // 3. Download
            const dataStr = JSON.stringify(backupPayload, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DUS_LifeOS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("Export Complete.");
            return true;
        } catch (error) {
            console.error("Export Failed:", error);
            alert("Dışa aktarma başarısız: " + error.message);
            throw error;
        }
    };

    // --- ROBUST IMPORT FUNCTION ---
    const importData = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target.result);

                    let dataToImport = {};
                    if (Array.isArray(content)) {
                        console.log("Legacy Backup Detected");
                        dataToImport = { topics: content };
                    } else if (content.data) {
                        console.log("v2 Backup Detected");
                        dataToImport = content.data;
                    } else {
                        throw new Error("Unknown backup format");
                    }

                    const db = await initDB();

                    const storesMap = {
                        topics: 'topics',
                        articles: 'articles',
                        folders: 'folders',
                        pearls: 'pearls',
                        questions: 'questions',
                        exams: 'exams',
                        mistakes: 'mistakes',
                        activities: 'activities',
                        workouts: 'fitness_workouts',
                        fitnessLogs: 'fitness_logs',
                        supplements: 'supplements',
                        supplementLogs: 'supplement_logs',
                        nutritionLogs: 'nutrition_logs'
                    };

                    for (const [key, storeName] of Object.entries(storesMap)) {
                        if (dataToImport[key] && Array.isArray(dataToImport[key])) {
                            const tx = db.transaction(storeName, 'readwrite');
                            for (const item of dataToImport[key]) {
                                await tx.store.put(item);
                            }
                            await tx.done;
                            console.log(`Restored ${key}: ${dataToImport[key].length} items`);
                        }
                    }

                    window.location.reload();
                    resolve(true);

                } catch (err) {
                    console.error('Import failed:', err);
                    alert("İçe aktarma hatası: " + err.message);
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    };

    return {
        data,
        isLoading,
        updateTopicStatus,
        updateTopicNote,
        addImage,
        removeImage,
        exportData,
        importData
    };
}
