import { auth, isDemoMode } from './firebase';
import { 
  signInWithPhoneNumber, 
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut
} from 'firebase/auth';

export const authService = {
  /**
   * Send OTP to a phone number.
   * On real Firebase: uses signInWithPhoneNumber with standard recaptcha-verifier
   * On demo mode: returns a mock result
   */
  sendOTP: async (phoneNumber, appVerifier) => {
    if (isDemoMode || !auth) {
      await new Promise(r => setTimeout(r, 1000));
      return {
        confirm: async (code) => {
          if (code === '123456' || code === '1234' || code === '111111') {
            const mockUid = 'mock_user_' + phoneNumber.replace(/\D/g, '').slice(-10);
            return {
              user: {
                uid: mockUid,
                phoneNumber: phoneNumber,
              }
            };
          } else {
            throw new Error('Invalid verification code');
          }
        }
      };
    }
    
    // Real Firebase Phone Auth
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  },

  onAuthStateChanged: (callback) => {
    if (isDemoMode || !auth) {
      // Always wipe any cached session so Login page is always shown first
      localStorage.removeItem('nearhire_user');
      callback(null);
      return () => {};
    }
    
    return fbOnAuthStateChanged(auth, callback);
  },

  signOut: async () => {
    if (isDemoMode || !auth) {
      localStorage.removeItem('nearhire_user');
      return;
    }
    await fbSignOut(auth);
  }
};
