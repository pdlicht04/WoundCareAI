import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user từ AsyncStorage khi khởi động
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }
      } catch (err) {
        console.log("❌ Lỗi load user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // 🔹 Lưu user vào AsyncStorage mỗi khi thay đổi
  const setUser = async (data) => {
    try {
      if (data) {
        await AsyncStorage.setItem("user", JSON.stringify(data));
      } else {
        await AsyncStorage.removeItem("user");
      }
      setUserState(data);
    } catch (err) {
      console.log("❌ Lỗi lưu user:", err);
    }
  };

  // 🔹 Hàm đăng xuất
  const logout = async () => {
    await AsyncStorage.removeItem("user");
    setUserState(null);
  };

  if (loading) return null; // tránh hiển thị UI khi đang load

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
