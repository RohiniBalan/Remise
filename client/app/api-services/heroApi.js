import axios from 'axios';

const API_URL = "https://wow-lifebackend.onrender.com/api";

const heroApi = {
  // Get active hero section (public)
  getActiveHero: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/hero`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all hero sections (admin only)
  getAllHeroSections: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/hero/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get hero section by ID (admin only)
  getHeroById: async (id, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/hero/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create hero section (admin only)
  createHeroSection: async (data, token) => {
    try {
      const response = await axios.post(`${API_URL}/api/hero`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update hero section (admin only)
  updateHeroSection: async (id, data, token) => {
    try {
      const response = await axios.put(`${API_URL}/api/hero/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete hero section (admin only)
  deleteHeroSection: async (id, token) => {
    try {
      const response = await axios.delete(`${API_URL}/api/hero/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle hero active status (admin only)
  toggleHeroActive: async (id, token) => {
    try {
      const response = await axios.patch(`${API_URL}/api/hero/${id}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default heroApi;