import { ref, getBlob } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Download file from Firebase Storage using authenticated Firebase SDK
 * @param {string} fileURL - Full Firebase Storage download URL
 * @returns {Promise<Blob>} - Downloaded file as Blob
 */
export async function downloadFromFirebaseStorage(fileURL) {
    try {
        // Parse path from URL
        const urlObj = new URL(fileURL);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)($|\?)/);

        if (!pathMatch) {
            throw new Error('Could not parse Firebase Storage path from URL');
        }

        const fullPath = decodeURIComponent(pathMatch[1]);
        console.log('📥 Downloading from path:', fullPath);

        // Use Firebase SDK for authenticated download
        const fileRef = ref(storage, fullPath);
        const blob = await getBlob(fileRef);

        console.log('✅ Downloaded:', blob.size, 'bytes');
        return blob;

    } catch (error) {
        console.error('❌ Firebase Storage download failed:', error);
        throw error;
    }
}
