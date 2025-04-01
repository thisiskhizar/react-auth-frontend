import { create } from "zustand";
import axios from "axios";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api/v1/auth"
    : "/api/v1/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
  message: null,

  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(`${API_URL}/register`, {
        firstName,
        lastName,
        email,
        password,
      });

      set({ isLoading: false, user: response.data.user });

      console.log("Registration Success!");
      console.log("User:", response.data.user);

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Error signing up",
      });

      return { success: false, message: error.response?.data?.message };
    }
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      set({
        isLoading: false,
        user: response.data.user,
        accessToken: response.data.accessToken,
        isAuthenticated: true,
      });

      await get().checkAuth();

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Login failed",
      });

      return { success: false, message: error.response?.data?.message };
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await axios.post(`${API_URL}/logout`);

      set({
        isLoading: false,
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Logout error",
      });

      return { success: false, message: "Failed to logout" };
    }
  },
  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const email = get().user?.email; // Get email from Zustand state
      if (!email) {
        return {
          success: false,
          message: "Email not found in state",
        };
      }

      const response = await axios.post(`${API_URL}/verify-code`, {
        email,
        code,
      });

      set({
        isLoading: false,
        user: response.data.user,
      });

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Verification failed",
      });

      return { success: false, message: error.response?.data?.message };
    }
  },
  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });

    try {
      console.log("Checking authentication...");

      await get().refreshAccessToken(); // Refresh token before checking auth

      const accessToken = get().accessToken;
      if (!accessToken) {
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        return;
      }

      const response = await axios.get(`${API_URL}/check-auth`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Auth Success!");

      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });

      console.error("Auth Error:", error);
    }
  },
  refreshAccessToken: async () => {
    try {
      const response = await axios.post(`${API_URL}/refresh-token`);
      set({ accessToken: response.data.accessToken });
      return response.data.accessToken;
    } catch (error) {
      console.error("Failed to refresh token", error);
      return null;
    }
  },
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });

      set({ isLoading: false });

      return { success: true, message: response.data.message };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to send reset link",
      });

      return { success: false, message: error.response?.data?.message };
    }
  },
  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/reset-password/${token}`, {
        password,
      });

      set({ isLoading: false });

      return { success: true, message: response.data.message };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to reset password",
      });

      return { success: false, message: error.response?.data?.message };
    }
  },
}));
