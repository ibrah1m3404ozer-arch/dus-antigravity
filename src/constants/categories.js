// Life OS - 4 Main Categories
export const MAIN_CATEGORIES = {
    dus: {
        key: 'dus',
        icon: '🎓',
        label: 'DUS',
        color: 'blue',
        bgColor: 'bg-blue-500',
        subcategories: [
            'Protetik', 'Cerrahi', 'Periodontoloji', 'Endodonti',
            'Ortodonti', 'Radyoloji', 'Restoratif', 'Pedodonti',
            'Patoloji', 'Anatomi', 'Biyokimya', 'Mikrobiyoloji',
            'Farmakoloji', 'Fizyoloji'
        ]
    },
    software: {
        key: 'software',
        icon: '💻',
        label: 'Yazılım/İş',
        color: 'purple',
        bgColor: 'bg-purple-500',
        subcategories: [
            'React', 'Python', 'Node.js', 'JavaScript', 'TypeScript',
            'Proje 1', 'Proje 2', 'Öğrenme', 'Geliştirme'
        ]
    },
    faculty: {
        key: 'faculty',
        icon: '🏫',
        label: 'Fakülte',
        color: 'green',
        bgColor: 'bg-green-500',
        subcategories: [
            'Ders', 'Klinik', 'Staj', 'Uygulama', 'Proje', 'Lab'
        ]
    },
    life: {
        key: 'life',
        icon: '🏋️‍♂️',
        label: 'Yaşam & Spor',
        color: 'orange',
        bgColor: 'bg-orange-500',
        subcategories: [
            'Spor', 'Uyku', 'Sosyal', 'Kitap', 'Hobi', 'Dinlenme'
        ]
    }
};

// Get main category by key
export const getMainCategory = (key) => {
    return MAIN_CATEGORIES[key] || null;
};

// Get all main category keys
export const getMainCategoryKeys = () => {
    return Object.keys(MAIN_CATEGORIES);
};

// Get subcategories for a main category
export const getSubcategories = (mainCategoryKey) => {
    return MAIN_CATEGORIES[mainCategoryKey]?.subcategories || [];
};

// Get category color
export const getCategoryColor = (mainCategoryKey) => {
    return MAIN_CATEGORIES[mainCategoryKey]?.bgColor || 'bg-gray-500';
};

// Get category icon
export const getCategoryIcon = (mainCategoryKey) => {
    return MAIN_CATEGORIES[mainCategoryKey]?.icon || '📌';
};

// Get category label
export const getCategoryLabel = (mainCategoryKey) => {
    return MAIN_CATEGORIES[mainCategoryKey]?.label || mainCategoryKey;
};

// Chart colors (hex for Recharts)
export const CHART_COLORS = {
    dus: '#3b82f6',      // blue-500
    software: '#a855f7', // purple-500
    faculty: '#22c55e',  // green-500
    life: '#f97316'      // orange-500
};

export const getChartColor = (mainCategoryKey) => {
    return CHART_COLORS[mainCategoryKey] || '#6b7280';
};
