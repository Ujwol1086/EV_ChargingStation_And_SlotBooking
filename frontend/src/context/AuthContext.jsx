import { useState, useEffect } from "react";
import api from "../api/axios";
import { AuthContext } from "./context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on page load
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data.user);
          setIsAuthenticated(true);
          setIsAdmin(response.data.user?.role === 'admin');
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
      const response = await api.post("/auth/register", userData);
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
      const response = await api.post("/auth/login", userData);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setIsAdmin(response.data.is_admin || false);
      return { success: true, is_admin: response.data.is_admin };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Login failed",
      };
    }
  };

  // Google login
  const googleLogin = async () => {
    try {
      // Get Google authorization URL from backend
      const response = await api.get("/auth/google/login");
      const { auth_url } = response.data;
      
      // Open Google OAuth in a popup window
      const popup = window.open(
        auth_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Wait for the popup to complete OAuth flow
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('OAuth popup was closed'));
          }
        }, 1000);

        // Listen for message from popup (if using postMessage)
        const messageHandler = (event) => {
          if (event.data && event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup.close();
            
            // Handle successful OAuth
            const { token, user, is_admin } = event.data;
            localStorage.setItem("token", token);
            setUser(user);
            setIsAuthenticated(true);
            setIsAdmin(is_admin || false);
            resolve({ success: true, is_admin });
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Google login failed",
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    // Redirect to login page after logout
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        register,
        login,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
