import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, Timer, Brain, FileJson, TrendingUp, Library,
    Dumbbell, Pill, Utensils, Wallet, LineChart, Settings,
    ChevronDown, ChevronRight, Activity, Sparkles, Menu, X,
    LogIn, LogOut, User, RefreshCw, CloudUpload, CloudDownload
} from 'lucide-react';
import { auth, loginWithGoogle, logoutUser } from '../utils/firebaseConfig';
import { syncAllFromFirestore, forceSyncAllToCloud } from '../utils/sync';

// Menu Groups Configuration
const MENU_GROUPS = [
    {
        id: 'dus',
        title: 'DUS Hazırlık',
        icon: BookOpen,
        color: '#3b82f6', // Blue
        borderColor: 'border-l-blue-500',
        items: [
            { icon: LayoutDashboard, label: 'Panel', path: '/' },
            { icon: Library, label: 'Kütüphane', path: '/library' },
            { icon: BookOpen, label: 'Müfredat & Konular', path: '/curriculum' },
            { icon: Timer, label: 'Pomodoro', path: '/pomodoro' },
            { icon: Brain, label: 'Soru Bankası', path: '/questions' },
            { icon: FileJson, label: 'Hap Bilgiler', path: '/pearls' },
            { icon: TrendingUp, label: 'Deneme Analizi', path: '/analytics' }
        ]
    },
    {
        id: 'fitness',
        title: 'Fitness & Yaşam',
        icon: Dumbbell,
        color: '#10b981', // Green
        borderColor: 'border-l-emerald-500',
        items: [
            { icon: Dumbbell, label: 'Antrenman Programı', path: '/fitness/schedule' },
            { icon: Pill, label: 'Supplementler', path: '/fitness/supplements' },
            { icon: Utensils, label: 'Beslenme & Makro', path: '/fitness/nutrition' },
            { icon: Activity, label: 'Gelişim Takibi', path: '/fitness/progress' }
        ]
    },
    {
        id: 'finance',
        title: 'Finansal Yönetim',
        icon: Wallet,
        color: '#f59e0b', // Yellow/Gold
        borderColor: 'border-l-yellow-500',
        items: [
            { icon: Wallet, label: 'Portföyüm', path: '/finance/portfolio' },
            { icon: Sparkles, label: 'Analiz & Stüdyo', path: '/finance/studio' }
        ]
    },
    {
        id: 'system',
        title: 'Sistem',
        icon: Settings,
        color: '#6b7280', // Gray
        borderColor: 'border-l-gray-500',
        items: [
            { icon: Settings, label: 'Genel Ayarlar & Yedekleme', path: '/settings' }
        ]
    }
];

function Sidebar() {
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState(['dus']); // DUS open by default
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(auth.currentUser);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    // Listen to auth changes
    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Auto-Sync Logic
    React.useEffect(() => {
        if (!user || user.isAnonymous) return;

        // Initial Sync on Mount (Silent)
        const runAutoSync = async () => {
            try {
                // Only pull changes, don't push automatically to avoid conflicts
                // Push happens instantly on user action anyway
                await syncAllFromFirestore((msg) => {
                    // Only show status for significant events or failures
                    // console.log("Auto-Sync:", msg);
                });
            } catch (e) {
                console.warn("Auto-sync failed:", e);
            }
        };

        // Run immediately then every 60 seconds
        runAutoSync();
        const intervalId = setInterval(runAutoSync, 60000);

        return () => clearInterval(intervalId);
    }, [user]);

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            window.location.reload();
        } catch (error) {
            setSyncMessage("Giriş Hatası!");
            setTimeout(() => setSyncMessage(""), 3000);
        }
    };

    const handleSync = async () => {
        if (!user) return;
        try {
            setIsSyncing(true);
            setSyncMessage("Başlatılıyor...");

            // 1. Push
            setSyncMessage("Gönderiliyor...");
            const uploaded = await forceSyncAllToCloud();

            // 2. Pull
            setSyncMessage("İndiriliyor...");
            const downloaded = await syncAllFromFirestore((msg) => setSyncMessage(msg));

            setSyncMessage(`✅ Tamamlandı (⬆️${uploaded} ⬇️${downloaded})`);

            // Clear message after 3 seconds
            setTimeout(() => setSyncMessage(""), 3000);

            // No need to reload, event listener handles it!
            // window.location.reload(); 
        } catch (error) {
            console.error(error);
            setSyncMessage("❌ Hata: " + error.message);
            setTimeout(() => setSyncMessage(""), 5000);
        } finally {
            setIsSyncing(false);
        }
    };

    // Determine which group should be auto-expanded based on current path
    React.useEffect(() => {
        const currentPath = location.pathname;

        MENU_GROUPS.forEach(group => {
            const hasActiveItem = group.items.some(item => {
                if (item.path === '/') {
                    return currentPath === '/';
                }
                return currentPath.startsWith(item.path);
            });

            if (hasActiveItem && !expandedGroups.includes(group.id)) {
                setExpandedGroups(prev => [...prev, group.id]);
            }
        });
    }, [location.pathname]);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-colors"
                aria-label="Open menu"
            >
                <Menu size={24} className="text-foreground" />
            </button>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-all duration-300
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Close button for mobile */}
                <button
                    onClick={closeMobileMenu}
                    className="lg:hidden absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
                    aria-label="Close menu"
                >
                    <X size={20} className="text-muted-foreground" />
                </button>

                {/* Logo */}
                <div className="p-6 flex-shrink-0 border-b border-border">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-yellow-400">
                        LIFE-OS
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Your Integrated System
                    </p>
                </div>

                {/* Accordion Menu */}
                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                    {MENU_GROUPS.map((group) => {
                        const isExpanded = expandedGroups.includes(group.id);
                        const GroupIcon = group.icon;
                        const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

                        // Check if any item in this group is active
                        const hasActiveItem = group.items.some(item => {
                            if (item.path === '/') {
                                return location.pathname === '/';
                            }
                            return location.pathname.startsWith(item.path);
                        });

                        return (
                            <div key={group.id} className="space-y-1">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group hover:bg-muted ${hasActiveItem ? 'bg-muted/50' : ''
                                        } border-l-4 ${group.borderColor}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <GroupIcon size={20} style={{ color: group.color }} />
                                        <span className="font-semibold text-sm">{group.title}</span>
                                    </div>
                                    <ChevronIcon size={18} className="text-muted-foreground transition-transform duration-200" />
                                </button>

                                {/* Group Items */}
                                {isExpanded && (
                                    <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                        {group.items.map((item) => {
                                            const ItemIcon = item.icon;

                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={closeMobileMenu}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${isActive
                                                            ? 'bg-primary/10 text-primary font-medium shadow-sm'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`
                                                    }
                                                >
                                                    <ItemIcon size={18} />
                                                    <span>{item.label}</span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer - Login/User Section */}
                <div className="p-4 border-t border-border flex-shrink-0 space-y-3">
                    {user && !user.isAnonymous ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                                ) : (
                                    <User size={20} className="text-muted-foreground" />
                                )}
                                <div className="flex flex-col truncate">
                                    <span className="text-xs font-medium truncate">{user.displayName}</span>
                                    {/* DEBUG ID DISPLAY */}
                                    <span className="text-[10px] text-muted-foreground truncate font-mono">
                                        ID: {user.uid.slice(0, 6)}...
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className={`text-blue-400 hover:text-blue-500 p-1 transition-transform ${isSyncing ? 'animate-spin' : ''}`}
                                    title="Tüm Verileri Eşitle (Yükle & İndir)"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button onClick={logoutUser} className="text-red-400 hover:text-red-500 p-1" title="Çıkış Yap">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <LogIn size={16} />
                            <span>Google ile Giriş Yap</span>
                        </button>
                    )}

                    <div className="bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-yellow-500/10 rounded-lg p-3 border border-primary/20">
                        <p className="text-xs text-muted-foreground text-center font-medium">
                            🚀 Your journey to excellence
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
