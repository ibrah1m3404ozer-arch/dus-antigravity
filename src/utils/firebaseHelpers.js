import { ref, getBlob } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Download file from Firebase Storage using authenticated Firebase SDK
 * @param {string} fileURL - Full Firebase Storage download URL
 * @returns {Promise<Blob>} - Downloaded file as Blob
 */
export async function downloadFromFirebaseStorage(fileURL) {
    try {
        console.log('📥 Starting Firebase Storage download...');
        console.log('  Input URL:', fileURL);

        // Parse path from URL
        const urlObj = new URL(fileURL);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)($|\?)/);

        if (!pathMatch) {
            console.error('❌ Could not parse path from URL');
            console.error('  Pathname:', urlObj.pathname);
            throw new Error('Could not parse Firebase Storage path from URL');
        }

        const fullPath = decodeURIComponent(pathMatch[1]);
        console.log('📥 Parsed path:', fullPath);

        // Use Firebase SDK for authenticated download
        const fileRef = ref(storage, fullPath);
        console.log('📥 Calling getBlob...');
        const blob = await getBlob(fileRef);

        console.log('✅ Download complete:', blob.size, 'bytes');
        return blob;

    } catch (error) {
        console.error('❌ Firebase Storage download failed');
        console.error('  Error type:', error.code || error.name);
        console.error('  Error message:', error.message);
        console.error('  Full error:', error);
        throw error;
    }
}
