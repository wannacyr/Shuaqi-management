import { createContext, useContext, useState, useCallback } from 'react';
import * as userApi from '../api/user';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getUser();
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemCoupon = useCallback(async () => {
    const data = await userApi.redeemCoupon();
    setUser(data);
    return data;
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, redeemCoupon }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
