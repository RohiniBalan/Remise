import axios from 'axios';

const API_URL = "https://wow-lifebackend.onrender.com/api";

// Define types
export interface TrendingVideo {
  id: number;
  title: string;
  category: string;
  views: string;
  duration: string;
  src: string;
  thumbnail?: string;
}

export interface TrendingContent {
  badgeText: string;
  title: string;
  titleGradient: string;
  description: string;
  buttonText: string;
  categories: string[];
  videos: TrendingVideo[];
  _id?: string;
  isActive?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const trendingApi = {
  // Get active trending section (public)
  getActiveTrending: async (): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getActiveTrending:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Get all trending sections (admin only)
  getAllTrendingSections: async (token: string): Promise<ApiResponse<TrendingContent[]>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in getAllTrendingSections:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Get trending section by ID (admin only)
  getTrendingById: async (id: string, token: string): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in getTrendingById:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Create trending section (admin only)
  createTrendingSection: async (data: Omit<TrendingContent, '_id'>, token: string): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.post(`${API_URL}/api/trending`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in createTrendingSection:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Update trending section (admin only)
  updateTrendingSection: async (id: string, data: Partial<TrendingContent>, token: string): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.put(`${API_URL}/api/trending/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in updateTrendingSection:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Delete trending section (admin only)
  deleteTrendingSection: async (id: string, token: string): Promise<ApiResponse<null>> => {
    try {
      const response = await axios.delete(`${API_URL}/api/trending/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteTrendingSection:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Toggle trending active status (admin only)
  toggleTrendingActive: async (id: string, token: string): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.patch(`${API_URL}/api/trending/${id}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in toggleTrendingActive:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Upload video (admin only)
  uploadVideo: async (file: File, token: string): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await axios.post(`${API_URL}/api/trending/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in uploadVideo:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Get categories (public)
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/categories`);
      return response.data;
    } catch (error: any) {
      console.error('Error in getCategories:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Add category (admin only)
  addCategory: async (category: string, token: string): Promise<ApiResponse<string[]>> => {
    try {
      const response = await axios.post(`${API_URL}/api/trending/categories`, 
        { category },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error in addCategory:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Delete category (admin only)
  deleteCategory: async (category: string, token: string): Promise<ApiResponse<string[]>> => {
    try {
      const response = await axios.delete(`${API_URL}/api/trending/categories/${encodeURIComponent(category)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in deleteCategory:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Get trending statistics (admin only)
  getTrendingStats: async (token: string): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in getTrendingStats:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  },

  // Preview trending section with different themes (public)
  previewWithTheme: async (id: string, theme: 'dark' | 'light'): Promise<ApiResponse<TrendingContent>> => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/${id}/preview?theme=${theme}`);
      return response.data;
    } catch (error: any) {
      console.error('Error in previewWithTheme:', error);
      throw error.response?.data || { message: error.message, success: false };
    }
  }
};

export default trendingApi;