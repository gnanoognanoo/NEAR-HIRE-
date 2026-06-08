import { storage, isDemoMode } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const storageService = {
  /**
   * Compress and upload photo to Firebase Storage
   * In demo mode, it stores the data URL in localStorage or returns a mock/data URL.
   */
  uploadProfilePhoto: async (userId, file) => {
    // 1. Simple client-side canvas-based image compression to keep it under 500kb
    const compressedFile = await compressImage(file, 800, 800, 0.7);

    if (isDemoMode || !storage) {
      // Demo/Mock mode: convert file to Base64 dataURL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          const base64data = reader.result;
          // Store in mock session or localStorage cache
          try {
            localStorage.setItem(`mock_avatar_${userId}`, base64data);
          } catch (e) {
            console.warn('Storage limit reached for mock avatar, using inline base64');
          }
          resolve(base64data);
        };
        reader.onerror = reject;
      });
    }

    // Real Firebase Storage upload
    const fileRef = ref(storage, `users/${userId}/profile.jpg`);
    await uploadBytes(fileRef, compressedFile);
    return await getDownloadURL(fileRef);
  },

  getPhotoURL: async (userId) => {
    if (isDemoMode || !storage) {
      return localStorage.getItem(`mock_avatar_${userId}`) || null;
    }
    try {
      const fileRef = ref(storage, `users/${userId}/profile.jpg`);
      return await getDownloadURL(fileRef);
    } catch {
      return null;
    }
  }
};

/**
 * Helper utility to compress images using Canvas
 */
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
}
