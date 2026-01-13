import { supabase, getCurrentUser } from './supabaseConfig';

/**
 * Download file from Supabase Storage
 * @param {string} fileURL - Full Supabase Storage URL or path
 * @returns {Promise<Blob>} - Downloaded file as Blob
 */
export async function downloadFromSupabaseStorage(fileURL) {
    try {
        console.log('📥 Starting download...');
        console.log('  Input URL:', fileURL);

        // CHECK: Is this an old Firebase URL?
        if (fileURL.includes('firebasestorage.googleapis.com') || fileURL.includes('firebase')) {
            console.log('⚠️ OLD FIREBASE URL DETECTED - Using CORS proxy');

            // Use CORS proxy for old Firebase URLs
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fileURL)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();

            console.log('✅ Downloaded via CORS proxy:', blob.size, 'bytes');
            return blob;
        }

        // Extract path from Supabase URL
        let filePath;

        if (fileURL.includes('/storage/v1/object/public/articles/')) {
            const match = fileURL.match(/\/storage\/v1\/object\/public\/articles\/(.+)$/);
            filePath = match ? match[1] : fileURL;
        } else {
            filePath = fileURL;
        }

        console.log('📥 Downloading from Supabase:', filePath);

        // Download from Supabase Storage
        const { data, error } = await supabase.storage
            .from('articles')
            .download(filePath);

        if (error) {
            console.error('❌ Supabase download failed:', error);
            throw error;
        }

        console.log('✅ Download complete:', data.size, 'bytes');
        return data;

    } catch (error) {
        console.error('❌ Download failed');
        console.error('  Error:', error.message);
        throw error;
    }
}

/**
 * Upload file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} path - Path in storage bucket
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadToSupabaseStorage(file, path) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const filePath = `${user.id}/${path}`;
        console.log('📤 Uploading to:', filePath);

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

        console.log('✅ Upload complete:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}
