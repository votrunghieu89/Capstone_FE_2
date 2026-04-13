import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5271';

const aiService = {
  chat: async (message: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/AI/chat`, { message });
      return response.data.response;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
};

export default aiService;
