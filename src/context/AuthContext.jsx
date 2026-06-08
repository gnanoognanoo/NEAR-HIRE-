import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/dataService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to persist to localStorage for fast loading/caching
  const persistUser = useCallback((user) => {
    if (user) {
      localStorage.setItem('nearhire_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nearhire_user');
    }
    setCurrentUser(user);
  }, []);

  // Sync auth state on mount
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await userService.getUser(firebaseUser.uid);
          if (profile) {
            persistUser({
              uid: firebaseUser.uid,
              phoneNumber: firebaseUser.phoneNumber,
              ...profile,
            });
          } else {
            persistUser({
              uid: firebaseUser.uid,
              phoneNumber: firebaseUser.phoneNumber,
              role: null,
            });
          }
        } else {
          persistUser(null);
        }
      } catch (error) {
        console.error('Error syncing auth state:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [persistUser]);

  /**
   * Completes the login process once Firebase user is obtained.
   * Checks for Firestore profile existence and persists user state.
   */
  const verifyLoginSession = async (firebaseUser) => {
    let profile = await userService.getUser(firebaseUser.uid);

    if (profile) {
      const user = {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        ...profile,
      };
      persistUser(user);
      return { profile: user, isNewUser: false };
    } else {
      const user = {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
        role: null,
      };
      persistUser(user);
      return { profile: user, isNewUser: true };
    }
  };

  /**
   * Fallback / demo-mode standalone login helper
   */
  const loginWithPhone = async (phoneNumber) => {
    const uid = 'user_' + phoneNumber.replace(/\D/g, '').slice(-10);
    const mockUser = { uid, phoneNumber };
    const { profile, isNewUser } = await verifyLoginSession(mockUser);
    return { user: profile, isNewUser };
  };

  /**
   * Set user role after registration
   */
  const updateUserRole = async (role) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, role };
    persistUser(updatedUser);

    await userService.createUser(currentUser.uid, {
      role,
      phone: currentUser.phoneNumber,
    });
  };

  /**
   * Update user profile data
   */
  const updateProfile = async (profileData) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...profileData };
    persistUser(updatedUser);

    await userService.updateUser(currentUser.uid, profileData);
  };

  /**
   * Logout
   */
  const logout = async () => {
    await authService.signOut();
    persistUser(null);
  };

  const value = {
    currentUser,
    loading,
    loginWithPhone,
    verifyLoginSession,
    updateUserRole,
    updateProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
