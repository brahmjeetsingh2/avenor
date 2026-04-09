import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const useAuth = () => {
  const { user, token, isAuthenticated, login, logout: storeLogout, setUser, updateUser } = useAuthStore();

  const loginUser = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    login(data.data.user, data.data.accessToken);
    return data.data.user;
  }, [login]);

  const registerUser = useCallback(async (formData) => {
    const data = await authService.register(formData);
    login(data.data.user, data.data.accessToken);
    return data.data.user;
  }, [login]);

  const logoutUser = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    storeLogout();
  }, [storeLogout]);

  const getDashboardPath = useCallback((role) => {
    const paths = {
      student: '/student/dashboard',
      coordinator: '/coordinator/dashboard',
      alumni: '/alumni/dashboard',
    };
    return paths[role] || '/';
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    loginUser,
    registerUser,
    logoutUser,
    setUser,
    updateUser,
    getDashboardPath,
    // keep backward compat
    login,
    logout: storeLogout,
  };
};

export default useAuth;
