import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials, logout, setLoading } from '../store/slices/authSlice';
import { useGetCurrentUserQuery } from '../store/api/authApi';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  // Query current user if token exists
  const {
    data: currentUserData,
    isLoading: isUserLoading,
    error: userError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !token || isAuthenticated,
  });

  useEffect(() => {
    if (currentUserData?.success && currentUserData.data) {
      dispatch(setCredentials({ user: currentUserData.data, token: token! }));
    } else if (userError && token) {
      // Token is invalid, logout user
      dispatch(logout());
    }
  }, [currentUserData, userError, token, dispatch]);

  useEffect(() => {
    dispatch(setLoading(isUserLoading));
  }, [isUserLoading, dispatch]);

  const login = (userData: any, authToken: string) => {
    dispatch(setCredentials({ user: userData, token: authToken }));
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout: logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
