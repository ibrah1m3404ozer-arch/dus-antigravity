import { supabase, getCurrentUser } from './supabaseConfig';

/**
 * Download file from Supabase Storage
 * @param {string} fileURL - Full Supabase Storage URL or path
 * @returns {Promise<Blob>} - Downloaded file as Blob
 */
export async function downloadFromSupabaseStorage(fileURL) {
    try {
        console.log('📥 Starting Supabase Storage download...');
        console.log('  Input URL:', fileURL);

        // Extract path from URL
        // Supabase URL format: https://[project].supabase.co/storage/v1/object/public/articles/[path]
        let filePath;

        if (fileURL.includes('/storage/v1/object/public/articles/')) {
            const match = fileURL.match(/\/storage\/v1\/object\/public\/articles\/(.+)$/);
            filePath = match ? match[1] : fileURL;
        } else {
            filePath = fileURL; // Assume it's already a path
        }

        console.log('📥 Downloading path:', filePath);

        // Download from Supabase Storage
        const { data, error } = await supabase.storage
            .from('articles')
            .download(filePath);

        if (error) {
            console.error('❌ Supabase Storage download failed');
            console.error('  Error:', error);
            throw error;
        }

        console.log('✅ Download complete:', data.size, 'bytes');
        return data; // data is already a Blob

    } catch (error) {
        console.error('❌ Download failed');
        console.error('  Error type:', error.name);
        console.error('  Error message:', error.message);
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
