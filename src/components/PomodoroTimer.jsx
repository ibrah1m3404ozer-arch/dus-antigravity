import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen, Settings, Volume2, VolumeX, CheckCircle, Flame, Plus, Minus, X } from 'lucide-react';
import { saveStudySession } from '../utils/db';

const DUS_SUBJECTS = [
    "Anatomi", "Fizyoloji", "Biyokimya", "Mikrobiyoloji", "Patoloji", "Farmakoloji",
    "Protetik Diş Tedavisi", "Restoratif Diş Tedavisi", "Endodonti", "Periodontoloji",
    "Ortodonti", "Pedodonti", "Ağız Diş ve Çene Cerrahisi", "Ağız Diş ve Çene Radyolojisi",
    "Genel"
];

const MODES = {
    WORK: 'work',
    SHORT_BREAK: 'short_break',
    LONG_BREAK: 'long_break'
};

// localStorage keys for persistence
const STORAGE_KEYS = {
    WORK_TIME: 'dus-pomodoro-workTime',
    SHORT_BREAK: 'dus-pomodoro-shortBreakTime',
    LONG_BREAK: 'dus-pomodoro-longBreakTime'
};

function PomodoroTimer() {
    // Timer Settings - initialize from localStorage
    const [workTime, setWorkTime] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.WORK_TIME);
        const parsed = Number(saved);
        return isNaN(parsed) ? 25 : parsed;
    });
    const [shortBreakTime, setShortBreakTime] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.SHORT_BREAK);
        const parsed = Number(saved);
        return isNaN(parsed) ? 5 : parsed;
    });
    const [longBreakTime, setLongBreakTime] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.LONG_BREAK);
        const parsed = Number(saved);
        return isNaN(parsed) ? 15 : parsed;
    });

    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState(MODES.WORK); // 'work', 'short_break', 'long_break'
    const [cycleCount, setCycleCount] = useState(0);

    // Subject Tracking
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    // Utils
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const audioRef = useRef(null);

    // Preload audio on mount
    useEffect(() => {
        audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audioRef.current.load();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.WORK_TIME, workTime.toString());
        localStorage.setItem(STORAGE_KEYS.SHORT_BREAK, shortBreakTime.toString());
        localStorage.setItem(STORAGE_KEYS.LONG_BREAK, longBreakTime.toString());
    }, [workTime, shortBreakTime, longBreakTime]);

    // Initial Load
    useEffect(() => {
        // Reset timer when workTime changes if not active
        if (!isActive && mode === MODES.WORK) {
            setTimeLeft(workTime * 60);
        }
    }, [workTime]);

    useEffect(() => {
        // Reset timer when breakTime changes if not active
        if (!isActive && mode === MODES.SHORT_BREAK) {
            setTimeLeft(shortBreakTime * 60);
        }
        if (!isActive && mode === MODES.LONG_BREAK) {
            setTimeLeft(longBreakTime * 60);
        }
    }, [shortBreakTime, longBreakTime]);

    // Timer Logic - optimized interval cleanup
    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            if (timeLeft === 0 && isActive) {
                handleTimerComplete();
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        playNotification();

        if (mode === MODES.WORK) {
            completeWorkSession();

            // Auto switch to break
            const newCycleCount = cycleCount + 1;
            setCycleCount(newCycleCount);

            if (newCycleCount % 4 === 0) {
                setMode(MODES.LONG_BREAK);
                setTimeLeft(longBreakTime * 60);
            } else {
                setMode(MODES.SHORT_BREAK);
                setTimeLeft(shortBreakTime * 60);
            }
        } else {
            // Break is over, back to work
            setMode(MODES.WORK);
            setTimeLeft(workTime * 60);
        }
    };

    const completeWorkSession = async () => {
        if (selectedSubject) {
            await saveStudySession({
                id: Date.now().toString(),
                subject: selectedSubject,
                duration: workTime,
                timestamp: new Date().toISOString()
            });
        }
    };

    const toggleTimer = () => {
        if (!isActive && mode === MODES.WORK && !selectedSubject) {
            alert("Lütfen başlamadan önce çalışacağınız dersi seçin!");
            return;
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (mode === MODES.WORK) setTimeLeft(workTime * 60);
        if (mode === MODES.SHORT_BREAK) setTimeLeft(shortBreakTime * 60);
        if (mode === MODES.LONG_BREAK) setTimeLeft(longBreakTime * 60);
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === MODES.WORK) setTimeLeft(workTime * 60);
        if (newMode === MODES.SHORT_BREAK) setTimeLeft(shortBreakTime * 60);
        if (newMode === MODES.LONG_BREAK) setTimeLeft(longBreakTime * 60);
    };

    const adjustTime = (amount) => {
        if (isActive) return;

        if (mode === MODES.WORK) {
            const newTime = Math.max(1, Math.min(120, workTime + amount));
            setWorkTime(newTime);
        } else if (mode === MODES.SHORT_BREAK) {
            const newTime = Math.max(1, Math.min(30, shortBreakTime + amount));
            setShortBreakTime(newTime);
        } else {
            const newTime = Math.max(1, Math.min(60, longBreakTime + amount));
            setLongBreakTime(newTime);
        }
    };

    const playNotification = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Memoized progress calculation
    const progress = useMemo(() => {
        const total = mode === MODES.WORK ? workTime * 60
            : mode === MODES.SHORT_BREAK ? shortBreakTime * 60
                : longBreakTime * 60;
        return ((total - timeLeft) / total) * 100;
    }, [mode, workTime, shortBreakTime, longBreakTime, timeLeft]);

    return (
        <div className="bg-card w-full max-w-2xl mx-auto rounded-3xl shadow-2xl border border-border overflow-hidden relative transition-all duration-500 hover:shadow-primary/10">
            {/* Header / Subject Selection */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'bg-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-secondary text-muted-foreground'}`}>
                        <Flame size={24} className={isActive ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Focus Timer</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            {mode === MODES.WORK ? 'Odaklanma Modu' : 'Mola Modu'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2.5 hover:bg-secondary rounded-xl transition-all opacity-70 hover:opacity-100">
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2.5 hover:bg-secondary rounded-xl transition-all opacity-70 hover:opacity-100">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Main Timer Display */}
            <div className="p-10 flex flex-col items-center justify-center relative min-h-[350px] bg-gradient-to-b from-background to-secondary/5">
                {/* Circular Progress (CSS based) */}
                <div
                    className="relative w-80 h-80 flex items-center justify-center mb-10 transition-transform duration-500"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{ transform: isHovered && !isActive ? 'scale(1.02)' : 'scale(1)' }}
                >
                    {/* Outer Glow Ring */}
                    <div className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-1000 ${isActive ? 'opacity-20 bg-primary' : 'opacity-0'}`}></div>

                    <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                        {/* Track */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-secondary opacity-20"
                        />
                        {/* Progress */}
                        <circle
                            cx="160"
                            cy="160"
                            r="140"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 140}
                            strokeDashoffset={2 * Math.PI * 140 * (1 - progress / 100)}
                            className={`transition-all duration-1000 ease-linear ${mode === MODES.WORK ? 'text-primary' : 'text-blue-500'
                                }`}
                            style={{
                                filter: mode === MODES.WORK ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))' : 'none',
                                strokeLinecap: "round"
                            }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        {/* Time Controls */}
                        {!isActive && (
                            <div className="absolute -top-10 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Only visible on hover/stopped, but let's make them always visible when stopped for better UX */}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {!isActive && (
                                <button
                                    onClick={() => adjustTime(-5)}
                                    className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
                                    title="-5 Dakika"
                                >
                                    <Minus size={24} />
                                </button>
                            )}

                            <div
                                className={`text-7xl font-black font-mono tracking-tighterTab transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                                style={{
                                    textShadow: mode === MODES.WORK
                                        ? '0 0 30px rgba(16, 185, 129, 0.4)'
                                        : '0 0 30px rgba(59, 130, 246, 0.4)'
                                }}
                            >
                                {formatTime(timeLeft)}
                            </div>

                            {!isActive && (
                                <button
                                    onClick={() => adjustTime(5)}
                                    className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
                                    title="+5 Dakika"
                                >
                                    <Plus size={24} />
                                </button>
                            )}
                        </div>

                        <div className={`text-sm font-bold mt-4 uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border transition-all duration-300 ${isActive
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary/50 text-muted-foreground border-white/5'
                            }`}>
                            {isActive ? 'YÜRÜTÜLÜYOR' : 'DURAKLATILDI'}
                        </div>
                    </div>
                </div>

                {/* Subject Selector (Visual Enhancement) */}
                {!isActive && mode === MODES.WORK && (
                    <div className="mb-8 w-full max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500 relative group">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background px-4 py-0.5 text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20 rounded-full z-10 shadow-sm">
                            Çalışılacak Ders
                        </div>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-secondary/30 hover:bg-secondary/50 border border-border/50 text-foreground text-center font-bold text-lg rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/50 outline-none shadow-lg transition-all appearance-none cursor-pointer backdrop-blur-sm"
                            >
                                <option value="" disabled>▼ Bir Ders Seçiniz ▼</option>
                                {DUS_SUBJECTS.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                            {/* Decorative Elements */}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-30 group-hover:opacity-70 transition-opacity">
                                <BookOpen size={20} />
                            </div>
                        </div>
                    </div>
                )}

                {mode !== MODES.WORK && (
                    <div className="mb-8 px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl text-sm font-medium animate-pulse shadow-lg shadow-blue-500/5">
                        ☕ Zihni dinlendirme zamanı • {mode === MODES.SHORT_BREAK ? 'Kısa' : 'Uzun'} Mola
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={resetTimer}
                        className="p-5 rounded-2xl bg-secondary hover:bg-secondary/80 text-muted-foreground transition-all hover:scale-105 active:scale-95 group"
                        title="Sıfırla"
                    >
                        <RotateCcw size={24} className="group-hover:-rotate-90 transition-transform duration-500" />
                    </button>

                    <button
                        onClick={toggleTimer}
                        className={`p-8 rounded-3xl shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 text-white flex items-center justify-center relative overflow-hidden group ${isActive
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                            : 'bg-primary hover:bg-primary/90 shadow-primary/30'
                            }`}
                    >
                        {/* Button Glow */}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                    </button>
                </div>
            </div>

            {/* Mode Logic Footer */}
            <div className="grid grid-cols-3 border-t border-border divide-x divide-border bg-secondary/5">
                <button
                    onClick={() => changeMode(MODES.WORK)}
                    className={`p-5 text-sm font-bold transition-all relative overflow-hidden group ${mode === MODES.WORK ? 'bg-primary/5 text-primary' : 'hover:bg-secondary/20 text-muted-foreground'}`}
                >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-primary transform transition-transform duration-300 ${mode === MODES.WORK ? 'scale-x-100' : 'scale-x-0'}`}></div>
                    <BookOpen size={20} className="mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                    ODAKLAN
                </button>
                <button
                    onClick={() => changeMode(MODES.SHORT_BREAK)}
                    className={`p-5 text-sm font-bold transition-all relative overflow-hidden group ${mode === MODES.SHORT_BREAK ? 'bg-blue-500/5 text-blue-500' : 'hover:bg-secondary/20 text-muted-foreground'}`}
                >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-blue-500 transform transition-transform duration-300 ${mode === MODES.SHORT_BREAK ? 'scale-x-100' : 'scale-x-0'}`}></div>
                    <Coffee size={20} className="mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                    KISA MOLA
                    <span className="block text-[10px] opacity-60 mt-1 font-normal bg-background/50 rounded-full px-2 py-0.5 mx-auto w-fit border border-border">{shortBreakTime} dk</span>
                </button>
                <button
                    onClick={() => changeMode(MODES.LONG_BREAK)}
                    className={`p-5 text-sm font-bold transition-all relative overflow-hidden group ${mode === MODES.LONG_BREAK ? 'bg-indigo-500/5 text-indigo-500' : 'hover:bg-secondary/20 text-muted-foreground'}`}
                >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-indigo-500 transform transition-transform duration-300 ${mode === MODES.LONG_BREAK ? 'scale-x-100' : 'scale-x-0'}`}></div>
                    <Coffee size={20} className="mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                    UZUN MOLA
                    <span className="block text-[10px] opacity-60 mt-1 font-normal bg-background/50 rounded-full px-2 py-0.5 mx-auto w-fit border border-border">{longBreakTime} dk</span>
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in" onClick={() => setShowSettings(false)}>
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">⚙️ Timer Ayarları</h3>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Odaklanma Süresi (dk)</label>
                                <input
                                    type="number"
                                    value={workTime}
                                    onChange={(e) => setWorkTime(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                    min="1"
                                    max="120"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Kısa Mola (dk)</label>
                                <input
                                    type="number"
                                    value={shortBreakTime}
                                    onChange={(e) => setShortBreakTime(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                    min="1"
                                    max="30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Uzun Mola (dk)</label>
                                <input
                                    type="number"
                                    value={longBreakTime}
                                    onChange={(e) => setLongBreakTime(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                                    min="1"
                                    max="60"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Kaydet
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PomodoroTimer;
