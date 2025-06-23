import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { AuthContext } from "./context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on page load
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await axiosInstance.get("/auth/me");
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
        }
      }

      setIsLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Registration failed",
      };
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      const response = await axiosInstance.post("/auth/login", userData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Login failed",
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
