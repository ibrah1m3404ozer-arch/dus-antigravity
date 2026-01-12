import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, Trophy, TrendingUp, Dumbbell, Utensils, Pill, Timer, Flame, Droplets } from 'lucide-react';
import { getFitnessWorkouts, getFitnessLogs } from '../utils/db';

function FitnessDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        workoutsThisWeek: 0,
        caloriesBurned: 0,
        streak: 0,
        waterIntake: 2.5,
        avgDuration: 0
    });
    const [todayWorkout, setTodayWorkout] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const workouts = await getFitnessWorkouts();
        const logs = await getFitnessLogs();

        // 1. Today's Workout
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayKey = days[new Date().getDay()];
        const workout = workouts.find(w => w.id === todayKey);
        setTodayWorkout(workout);

        // 2. Stats Calculation
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Workouts This Week
        const weekLogs = logs.filter(l => new Date(l.date) >= startOfWeek);

        // Avg Duration
        const totalDuration = weekLogs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const avgDur = weekLogs.length > 0 ? Math.round(totalDuration / weekLogs.length / 60) : 0;

        setStats({
            workoutsThisWeek: weekLogs.length,
            caloriesBurned: weekLogs.length * 350,
            streak: logs.length,  // Simplified streak
            waterIntake: 2.5,
            avgDuration: avgDur
        });
    };

    const modules = [
        {
            title: 'Antrenman Programı',
            icon: Calendar,
            path: '/fitness/schedule',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            desc: 'Haftalık planını düzenle'
        },
        {
            title: 'Gelişim Takibi',
            icon: TrendingUp,
            path: '/fitness/progress',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            desc: 'Vücut ölçüleri ve ağırlık'
        },
        {
            title: 'Beslenme Günlüğü',
            icon: Utensils,
            path: '/fitness/nutrition',
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            desc: 'Kalori ve makro takibi'
        },
        {
            title: 'Supplement Çantası',
            icon: Pill,
            path: '/fitness/supplements',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            desc: 'Takviye stok durumu'
        }
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-white shadow-2xl border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
                            Fitness Hub ⚡
                        </h1>
                        <p className="text-indigo-200 text-lg">
                            "Bugünkü ter, yarınki güçtür." Seviye atlamaya hazır mısın?
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{stats.streak}</div>
                            <div className="text-xs text-indigo-200">Gün Streak</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                            <Activity className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{stats.workoutsThisWeek}</div>
                            <div className="text-xs text-indigo-200">Antrenman</div>
                        </div>
                    </div>
                </div>

                {/* Decoration Circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            {/* Today's Workout Quick View */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Dumbbell className="text-orange-500" />
                            Bugünün Antrenmanı
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {todayWorkout?.isRestDay ? 'Bugün dinlenme günü! 😴' : todayWorkout?.focusArea || 'Planlanmış antrenman yok'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/fitness/schedule')}
                        className="px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl text-sm font-bold transition-all"
                    >
                        Programa Git
                    </button>
                </div>

                {!todayWorkout?.isRestDay && todayWorkout?.exercises?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {todayWorkout.exercises.slice(0, 3).map((ex, i) => (
                            <div key={i} className="bg-secondary/30 p-3 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
                                    {i + 1}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold truncate text-sm">{ex.name}</p>
                                    <p className="text-xs text-muted-foreground">{ex.sets} set x {ex.reps}</p>
                                </div>
                            </div>
                        ))}
                        {todayWorkout.exercises.length > 3 && (
                            <div className="flex items-center justify-center text-xs text-muted-foreground font-medium">
                                +{todayWorkout.exercises.length - 3} hareket daha...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(module.path)}
                        className="group relative overflow-hidden bg-card border border-border hover:border-primary/50 p-6 rounded-3xl text-left transition-all hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${module.bg} ${module.color} group-hover:scale-110 transition-transform`}>
                                <module.icon size={32} />
                            </div>
                            <div className="p-2 rounded-full bg-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrendingUp size={16} className="text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{module.title}</h3>
                        <p className="text-muted-foreground font-medium">{module.desc}</p>

                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </button>
                ))}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Droplets className="text-blue-500 mb-2" />
                    <div className="text-2xl font-black">2.5L</div>
                    <div className="text-xs text-muted-foreground">Su Hedefi</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Timer className="text-purple-500 mb-2" />
                    <div className="text-2xl font-black">{stats.avgDuration}dk</div>
                    <div className="text-xs text-muted-foreground">Ort. Süre</div>
                </div>
                {/* Placeholders for future expansion */}
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center text-center opacity-50">
                    <Trophy className="text-yellow-500 mb-2" />
                    <div className="text-2xl font-black">-</div>
                    <div className="text-xs text-muted-foreground">PR Rekoru</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center text-center opacity-50">
                    <TrendingUp className="text-green-500 mb-2" />
                    <div className="text-2xl font-black">-</div>
                    <div className="text-xs text-muted-foreground">Kilo Değişimi</div>
                </div>
            </div>
        </div>
    );
}

export default FitnessDashboard;
