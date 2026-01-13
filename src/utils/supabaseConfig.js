import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://mhtwysevelntacjrszib.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHd5c2V2ZWxudGFjanJzemliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTg4NjcsImV4cCI6MjA1MjM3NDg2N30.7HvE_n7yPNcSem16D45mWyjQ_9U8DmMta-AkPDMNZdA';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Auth Helpers
export const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });

    if (error) throw error;
    return data;
};

export const loginAnonymously = async () => {
    // Supabase doesn't have built-in anonymous auth
    // We'll use a guest account approach
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
};

export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.reload();
};

// Get current user
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// Auth state observer
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
    });
};

// Initialize and wait for auth
export const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        return session.user;
    }

    // Auto sign in anonymously if no user
    try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        return data.user;
    } catch (err) {
        console.warn('Anonymous auth failed:', err);
        return null;
    }
};

export { supabase as auth };
