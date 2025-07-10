import React, { createContext, useContext, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addNotification, removeNotification } from '../store/slices/uiSlice';
import NotificationContainer from '../components/UI/NotificationContainer';

interface NotificationContextType {
  showNotification: (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string,
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state: RootState) => state.ui.notifications
  );

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    dispatch(
      addNotification({
        type,
        title,
        message,
        duration,
      })
    );
  };

  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };

  const value: NotificationContextType = {
    showNotification,
    removeNotification: handleRemoveNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={handleRemoveNotification}
      />
    </NotificationContext.Provider>
  );
};
