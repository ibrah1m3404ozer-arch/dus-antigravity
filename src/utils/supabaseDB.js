import { supabase, getCurrentUser } from './supabaseConfig';

// =======================
// STORAGE HELPERS
// =======================

export const storageHelpers = {
    // Upload file to Supabase Storage
    async uploadFile(file, path) {
        const user = await getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const filePath = `${user.id}/${path}`;

        const { data, error } = await supabase.storage
            .from('articles')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('articles')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    // Download file from Supabase Storage  
    async downloadFile(url) {
        // Extract path from URL
        const pathMatch = url.match(/articles\/(.+)$/);
        if (!pathMatch) throw new Error('Invalid storage URL');

        const { data, error } = await supabase.storage
            .from('articles')
            .download(pathMatch[1]);

        if (error) throw error;
        return data; // Returns Blob
    },

    // Delete file from Storage
    async deleteFile(path) {
        const user = await getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const filePath = `${user.id}/${path}`;

        const { error } = await supabase.storage
            .from('articles')
            .remove([filePath]);

        if (error) throw error;
    }
};

// =======================
// LIBRARY ARTICLES
// =======================

export const getAllLibraryArticles = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('library_articles')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveLibraryArticle = async (article) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('library_articles')
        .upsert({
            ...article,
            userId: user.id,
            updatedAt: new Date().toISOString()
        })
        .select();

    if (error) throw error;
    return data[0];
};

export const deleteLibraryArticle = async (id) => {
    const { error } = await supabase
        .from('library_articles')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// =======================
// LIBRARY FOLDERS
// =======================

export const getAllLibraryFolders = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('library_folders')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveLibraryFolder = async (folder) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('library_folders')
        .upsert({
            ...folder,
            userId: user.id
        })
        .select();

    if (error) throw error;
    return data[0];
};

export const deleteLibraryFolder = async (id) => {
    const { error } = await supabase
        .from('library_folders')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// =======================
// TOPICS
// =======================

export const getAllTopics = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveTopic = async (topic) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('topics')
        .upsert({
            ...topic,
            userId: user.id
        })
        .select();

    if (error) throw error;
    return data[0];
};

export const deleteTopic = async (id) => {
    const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// =======================
// FITNESS WORKOUTS
// =======================

export const getAllWorkouts = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveWorkout = async (workout) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('fitness_workouts')
        .upsert({
            ...workout,
            userId: user.id
        })
        .select();

    if (error) throw error;
    return data[0];
};

// =======================
// SUPPLEMENTS
// =======================

export const getAllSupplements = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveSupplement = async (supplement) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('supplements')
        .upsert({
            ...supplement,
            userId: user.id
        })
        .select();

    if (error) throw error;
    return data[0];
};

// =======================
// ASSETS
// =======================

export const getAllAssets = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('userId', user.id);

    if (error) throw error;
    return data || [];
};

export const saveAsset = async (asset) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('assets')
        .upsert({
            ...asset,
            userId: user.id
        })
        .select();

    if (error) throw error;
    return data[0];
};
