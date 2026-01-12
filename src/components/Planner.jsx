import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivitiesByDate, deleteActivity } from '../utils/db';
import { MAIN_CATEGORIES, getCategoryColor, getCategoryIcon, getCategoryLabel, getSubcategories } from '../constants/categories';
import AddActivityModal from './AddActivityModal';

function Planner() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activities, setActivities] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        loadActivities();
    }, [selectedDate]);

    const loadActivities = async () => {
        const acts = await getActivitiesByDate(selectedDate);
        setActivities(acts.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
    };

    const handleDeleteActivity = async (id) => {
        if (window.confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) {
            await deleteActivity(id);
            await loadActivities();
            setToast({ show: true, message: 'Aktivite silindi' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}dk`;
        if (mins === 0) return `${hours}sa`;
        return `${hours}sa ${mins}dk`;
    };

    const getTotalDurationForCategory = (category) => {
        return activities
            .filter(act => act.mainCategory === category)
            .reduce((sum, act) => sum + act.duration, 0);
    };

    const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const isToday = selectedDate.toDateString() === new Date().toDateString();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Planlayıcı
                    </h2>
                    <p className="text-muted-foreground mt-1">Aktivitelerinizi kaydedin ve zaman yönetimi yapın</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    <Plus size={20} />
                    Aktivite Ekle
                </button>
            </div>

            {/* Date Navigator */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrevDay}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <Calendar className="text-indigo-500" size={24} />
                        <div className="text-center">
                            <p className="text-2xl font-bold">
                                {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
                            </p>
                        </div>
                        {!isToday && (
                            <button
                                onClick={handleToday}
                                className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                            >
                                Bugün
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleNextDay}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="text-indigo-500" size={18} />
                        <span className="text-xs text-muted-foreground">Toplam</span>
                    </div>
                    <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                </div>

                {Object.keys(MAIN_CATEGORIES).map(catKey => {
                    const duration = getTotalDurationForCategory(catKey);
                    const category = MAIN_CATEGORIES[catKey];
                    return (
                        <div key={catKey} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{category.icon}</span>
                                <span className="text-xs text-muted-foreground">{category.label}</span>
                            </div>
                            <p className="text-2xl font-bold">{formatDuration(duration)}</p>
                        </div>
                    );
                })}
            </div>

            {/* Activities List */}
            {activities.length > 0 ? (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Aktiviteler</h3>
                    {activities.map(activity => {
                        const category = MAIN_CATEGORIES[activity.mainCategory];
                        return (
                            <div
                                key={activity.id}
                                className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`${category.bgColor} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                                                <span>{category.icon}</span>
                                                {category.label}
                                            </span>
                                            <span className="text-sm font-medium text-muted-foreground">→</span>
                                            <span className="text-sm font-medium">{activity.subcategory}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${activity.type === 'pomodoro' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {activity.type === 'pomodoro' ? '🍅 Pomodoro' : '✍️ Manuel'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
                                            </div>
                                            <span className="font-medium text-foreground">{formatDuration(activity.duration)}</span>
                                        </div>

                                        {activity.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">{activity.notes}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteActivity(activity.id)}
                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                    <Calendar size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">Bu tarihte aktivite yok</p>
                    <p className="text-sm text-muted-foreground mt-2">Aktivite ekleyerek başlayın</p>
                </div>
            )}

            {/* Add Activity Modal */}
            {showAddModal && (
                <AddActivityModal
                    onClose={() => setShowAddModal(false)}
                    onSave={() => {
                        setShowAddModal(false);
                        loadActivities();
                    }}
                    selectedDate={selectedDate}
                />
            )}

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}

export default Planner;
