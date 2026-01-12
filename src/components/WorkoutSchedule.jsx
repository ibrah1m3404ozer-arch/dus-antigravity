import React, { useState, useEffect } from 'react';
import { Dumbbell, Edit2, CheckCircle2, AlertCircle, Play, Timer, Save, X } from 'lucide-react';
import { getFitnessWorkouts, saveFitnessWorkout, saveFitnessLog, initDB } from '../utils/db'; // Added saveFitnessLog

// ... (rest of code until WorkoutSchedule function)

const DAYS = [
    { key: 'monday', label: 'Pazartesi' },
    { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' },
    { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' },
    { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' },
];

function WorkoutSchedule() {
    const [workouts, setWorkouts] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Active Workout State
    const [activeWorkout, setActiveWorkout] = useState(null); // If not null, we are in "Workout Mode"
    const [activeLogs, setActiveLogs] = useState([]); // Stores actual sets/reps for current session
    const [sessionTimer, setSessionTimer] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);

    // Edit Form State
    const [focusArea, setFocusArea] = useState('');
    const [exercises, setExercises] = useState([]);
    const [isRestDay, setIsRestDay] = useState(false);

    useEffect(() => {
        loadWorkouts();
    }, []);

    // Timer Logic
    useEffect(() => {
        if (activeWorkout) {
            const interval = setInterval(() => {
                setSessionTimer(prev => prev + 1);
            }, 1000);
            setTimerInterval(interval);
        } else {
            clearInterval(timerInterval);
            setSessionTimer(0);
        }
        return () => clearInterval(timerInterval);
    }, [activeWorkout]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const loadWorkouts = async () => {
        // ... (existing loadWorkouts logic)
        const data = await getFitnessWorkouts();

        if (data.length === 0) {
            // Seed initial data from user request
            const INITIAL_WORKOUTS = [
                {
                    id: 'monday', day: 'Pazartesi', focusArea: 'Push (Göğüs/Omuz/Triceps)',
                    exercises: [
                        { name: 'Plate loaded chest press', sets: '2', reps: '6-8 (60kg)' },
                        { name: 'Smith machine low incline press', sets: '2', reps: '6-8 (25kg)' },
                        { name: 'Chest fly machine', sets: '3', reps: '8-10 (35kg)' },
                        { name: 'Shoulder press machine', sets: '2', reps: '6-8 (17.5kg)' },
                        { name: 'Lateral raise', sets: '3', reps: '8-10 (10kg)' },
                        { name: 'Triceps pushdown', sets: '2', reps: '6-8 (65kg)' },
                        { name: 'Overhead rope extension', sets: '2', reps: '8-10 (Failure)' }
                    ], isRestDay: false
                },
                {
                    id: 'tuesday', day: 'Salı', focusArea: 'Pull (Sırt/Biceps)',
                    exercises: [
                        { name: 'Lat pulldown', sets: '2', reps: '6-8 (75kg)' },
                        { name: 'Plate loaded wide grip row', sets: '2', reps: '6-8 (30kg)' },
                        { name: 'Cable row', sets: '2', reps: '8-10 (60kg)' },
                        { name: 'Dumbbell curl', sets: '2', reps: '6-8 (12.5kg)' },
                        { name: 'Cable curl', sets: '2', reps: '6-8 (50kg)' },
                        { name: 'Hammer/Reverse curl (SS)', sets: '2', reps: '8-10 (10kg)' }
                    ], isRestDay: false
                },
                {
                    id: 'wednesday', day: 'Çarşamba', focusArea: 'Legs (Bacak)',
                    exercises: [
                        { name: 'Leg press', sets: '2', reps: '6-8 (Rir1)' },
                        { name: 'Smith machine squat', sets: '2', reps: '6-8 (Rir1)' },
                        { name: 'Leg extension', sets: '2', reps: '8-10 (Failure)' },
                        { name: 'Seated leg curl', sets: '3', reps: '8-10 (Rir1)' }
                    ], isRestDay: false
                },
                { id: 'thursday', day: 'Perşembe', focusArea: '', exercises: [], isRestDay: true },
                {
                    id: 'friday', day: 'Cuma', focusArea: 'Push B (Omuz/Göğüs/Triceps)',
                    exercises: [
                        { name: 'Shoulder press machine', sets: '2', reps: '6-8 (20kg)' },
                        { name: 'Lateral raise', sets: '3', reps: '8-10 (10kg)' },
                        { name: 'Smith machine low incline press', sets: '2', reps: '6-8 (25kg)' },
                        { name: 'Chest fly machine', sets: '2', reps: '6-8 (50kg)' },
                        { name: 'Cable rear delt fly', sets: '3', reps: '8-10 (70kg)' },
                        { name: 'Triceps pushdown', sets: '2', reps: '6-8 (70kg)' },
                        { name: 'Overhead rope extension', sets: '2', reps: '8-10 (40kg)' }
                    ], isRestDay: false
                },
                {
                    id: 'saturday', day: 'Cumartesi', focusArea: 'Pull B + Legs',
                    exercises: [
                        { name: 'Plate loaded wide grip row', sets: '2', reps: '6-8 (35kg)' },
                        { name: 'Close grip lat pulldown', sets: '2', reps: '6-8 (65kg)' },
                        { name: 'Cable curl', sets: '2', reps: '6-8 (55kg)' },
                        { name: 'Hammer/Reverse curl (SS)', sets: '2', reps: '8-10 (10kg)' },
                        { name: 'Leg press', sets: '2', reps: '6-8 (150kg)' },
                        { name: 'Leg extension', sets: '2', reps: '6-8 (90kg)' },
                        { name: 'Seated leg curl', sets: '2', reps: '8-10 (60kg)' }
                    ], isRestDay: false
                },
                { id: 'sunday', day: 'Pazar', focusArea: '', exercises: [], isRestDay: true }
            ];

            const workoutMap = {};
            for (const w of INITIAL_WORKOUTS) {
                await saveFitnessWorkout(w);
                workoutMap[w.id] = w;
            }
            setWorkouts(workoutMap);
        } else {
            const workoutMap = {};
            data.forEach(w => workoutMap[w.id] = w);
            setWorkouts(workoutMap);
        }
    };

    const handleDayClick = (day) => {
        const workout = workouts[day.key] || { focusArea: '', exercises: [], isRestDay: false };
        setSelectedDay(day);
        setFocusArea(workout.focusArea);
        setExercises(workout.exercises || []);
        setIsRestDay(workout.isRestDay);
        setEditModalOpen(true);
    };

    const startWorkout = () => {
        if (!selectedDay) return;
        const workout = workouts[selectedDay.key];

        // Prepare initial logs based on planned exercises
        const logs = workout.exercises.map(ex => ({
            name: ex.name,
            plannedSets: ex.sets,
            plannedReps: ex.reps,
            actualSets: [], // Array of {weight, reps}
            completed: false
        }));

        setActiveLogs(logs);
        setActiveWorkout(workout);
        setEditModalOpen(false); // Close edit modal
    };

    const handleLogSet = (exerciseIndex, setIndex, field, value) => {
        const newLogs = [...activeLogs];
        if (!newLogs[exerciseIndex].actualSets[setIndex]) {
            newLogs[exerciseIndex].actualSets[setIndex] = { weight: '', reps: '' };
        }
        newLogs[exerciseIndex].actualSets[setIndex][field] = value;
        setActiveLogs(newLogs);
    };

    const addSet = (exerciseIndex) => {
        const newLogs = [...activeLogs];
        newLogs[exerciseIndex].actualSets.push({ weight: '', reps: '' });
        setActiveLogs(newLogs);
    };

    const toggleExerciseComplete = (index) => {
        const newLogs = [...activeLogs];
        newLogs[index].completed = !newLogs[index].completed;
        setActiveLogs(newLogs);
    };

    const finishWorkout = async () => {
        if (!activeWorkout) return;

        const log = {
            id: Date.now().toString(),
            workoutId: activeWorkout.id,
            day: activeWorkout.day,
            date: new Date().toISOString(),
            durationSeconds: sessionTimer,
            exercises: activeLogs
        };

        await saveFitnessLog(log);
        alert('Antrenman kaydedildi! Harika iş çıkardın! 💪');
        setActiveWorkout(null);
        setSessionTimer(0);
        // Navigate or just refresh list...
    };

    // ... (rest of methods: handleAddExercise, handleExerciseChange, handleRemoveExercise, handleSave)
    const handleAddExercise = () => {
        setExercises([...exercises, { name: '', sets: '', reps: '' }]);
    };

    const handleExerciseChange = (index, field, value) => {
        const newExercises = [...exercises];
        newExercises[index][field] = value;
        setExercises(newExercises);
    };

    const handleRemoveExercise = (index) => {
        const newExercises = list => list.filter((_, i) => i !== index);
        setExercises(newExercises(exercises));
    };

    const handleSave = async () => {
        const workout = {
            id: selectedDay.key,
            day: selectedDay.label,
            focusArea,
            exercises: exercises.filter(e => e.name.trim() !== ''),
            isRestDay
        };
        await saveFitnessWorkout(workout);
        setEditModalOpen(false);
        loadWorkouts();
    };


    if (activeWorkout) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Active Workout Header */}
                <div className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white flex justify-between items-center shadow-lg">
                    <div>
                        <h2 className="text-2xl font-black italic">{activeWorkout.focusArea}</h2>
                        <div className="flex items-center gap-2 opacity-90">
                            <Timer size={18} />
                            <span className="font-mono text-xl">{formatTime(sessionTimer)}</span>
                        </div>
                    </div>
                    <button onClick={() => setActiveWorkout(null)} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                        <X size={24} />
                    </button>
                </div>

                {/* Workout Logger Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                    {activeLogs.map((log, exIndex) => (
                        <div key={exIndex} className={`bg-card border ${log.completed ? 'border-green-500/50 bg-green-500/5' : 'border-border'} rounded-2xl p-5 shadow-sm transition-all`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{log.name}</h3>
                                    <p className="text-sm text-muted-foreground">Hedef: {log.plannedSets} set x {log.plannedReps}</p>
                                </div>
                                <button
                                    onClick={() => toggleExerciseComplete(exIndex)}
                                    className={`p-2 rounded-full ${log.completed ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'}`}
                                >
                                    <CheckCircle2 size={24} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(log.actualSets.length > 0 ? log.actualSets : [{ weight: '', reps: '' }, { weight: '', reps: '' }]).map((set, setIndex) => (
                                    <div key={setIndex} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground">
                                            {setIndex + 1}
                                        </div>
                                        <input
                                            placeholder="kg"
                                            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-center"
                                            value={set.weight || ''}
                                            onChange={e => handleLogSet(exIndex, setIndex, 'weight', e.target.value)}
                                        />
                                        <input
                                            placeholder="tekrar"
                                            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-center"
                                            value={set.reps || ''}
                                            onChange={e => handleLogSet(exIndex, setIndex, 'reps', e.target.value)}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => addSet(exIndex)}
                                    className="w-full py-2 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-lg hover:bg-orange-500/20"
                                >
                                    + Set Ekle
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-0 left-0 w-full bg-background border-t border-border p-4 flex gap-4">
                    <button
                        onClick={finishWorkout}
                        className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
                    >
                        <Save />
                        Antrenmanı Bitir & Kaydet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Same layout as before */}
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-emerald-500">
                    Haftalık Program
                </h2>
                <p className="text-muted-foreground mt-1">Antrenman planını oluştur ve takip et 💪</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {DAYS.map(day => {
                    const workout = workouts[day.key];
                    const hasWorkout = workout && !workout.isRestDay && workout.exercises?.length > 0;
                    const isRest = workout?.isRestDay;

                    return (
                        <button
                            key={day.key}
                            onClick={() => handleDayClick(day)}
                            className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isRest
                                ? 'bg-secondary/30 border-border opacity-70'
                                : hasWorkout
                                    ? 'bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20'
                                    : 'bg-card border-border hover:border-orange-500/30'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg">{day.label}</span>
                                {hasWorkout && <Dumbbell className="text-orange-500 w-5 h-5" />}
                                {isRest && <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">OFF</span>}
                            </div>

                            {hasWorkout ? (
                                <div>
                                    <p className="font-medium text-orange-500 mb-2 truncate">{workout.focusArea}</p>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        {workout.exercises.slice(0, 3).map((ex, i) => (
                                            <li key={i} className="truncate">• {ex.name}</li>
                                        ))}
                                        {workout.exercises.length > 3 && <li className="text-xs opacity-70">+ {workout.exercises.length - 3} hareket</li>}
                                    </ul>
                                </div>
                            ) : isRest ? (
                                <div className="h-20 flex items-center justify-center text-muted-foreground text-sm italic">
                                    Dinlenme Günü 😴
                                </div>
                            ) : (
                                <div className="h-20 flex items-center justify-center text-muted-foreground text-sm opacity-50 border-2 border-dashed border-border rounded-xl">
                                    Planla +
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEditModalOpen(false)}>
                    <div className="bg-card w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Edit2 className="text-orange-500" size={24} />
                                {selectedDay.label} Planı
                            </h3>
                            <div className="flex gap-2">
                                {!isRestDay && (
                                    <button
                                        onClick={startWorkout}
                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
                                    >
                                        <Play size={16} fill="white" />
                                        BAŞLA
                                    </button>
                                )}
                                <button onClick={() => setEditModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                                    <X />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRestDay}
                                        onChange={e => setIsRestDay(e.target.checked)}
                                        className="w-5 h-5 accent-orange-500 rounded"
                                    />
                                    <span className="font-medium">Dinlenme Günü</span>
                                </label>
                            </div>

                            {!isRestDay && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Odak Bölgesi</label>
                                        <input
                                            type="text"
                                            value={focusArea}
                                            onChange={e => setFocusArea(e.target.value)}
                                            placeholder="Örn: Göğüs + Ön Kol"
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium">Hareketler</label>
                                            <button onClick={handleAddExercise} className="text-xs text-orange-500 font-bold hover:underline">
                                                + Hareket Ekle
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {exercises.map((ex, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        placeholder="Hareket Adı"
                                                        value={ex.name}
                                                        onChange={e => handleExerciseChange(i, 'name', e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                                    />
                                                    <input
                                                        placeholder="Set"
                                                        value={ex.sets}
                                                        onChange={e => handleExerciseChange(i, 'sets', e.target.value)}
                                                        className="w-16 px-3 py-2 bg-background border border-border rounded-lg text-sm text-center"
                                                    />
                                                    <input
                                                        placeholder="Tekrar"
                                                        value={ex.reps}
                                                        onChange={e => handleExerciseChange(i, 'reps', e.target.value)}
                                                        className="w-32 px-3 py-2 bg-background border border-border rounded-lg text-sm text-center"
                                                    />
                                                    <button onClick={() => handleRemoveExercise(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            {exercises.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4 italic">Henüz hareket eklenmedi.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                            <button onClick={handleSave} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold">Değişiklikleri Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Data Button (Bottom of page) */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={async () => {
                        if (confirm('Mevcut antrenman programını sıfırlayıp senin için hazırladığım programı yüklemek ister misin?')) {
                            try {
                                const db = await initDB();
                                const tx = db.transaction('fitness_workouts', 'readwrite');
                                await tx.store.clear();
                                await tx.done;
                                window.location.reload();
                            } catch (e) {
                                console.error(e);
                                alert('Hata: ' + e.message + '\n\nVeritabanı tablosu henüz oluşmamış olabilir. Sayfayı yenilemeyi dene.');
                            }
                        }
                    }}
                    className="text-xs text-muted-foreground hover:text-orange-500 underline"
                >
                    Programın Görünmüyor mu? Buraya Tıkla (Sıfırla ve Yükle)
                </button>
            </div>
        </div>
    );
}

export default WorkoutSchedule;
