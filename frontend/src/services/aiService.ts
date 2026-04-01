import { aiApi } from './api';

export interface DiagnosisParams {
  description: string;
  image?: File;
}

export const aiService = {
  diagnose: async (params: DiagnosisParams) => {
    const formData = new FormData();
    formData.append('description', params.description);
    if (params.image) {
      formData.append('image', params.image);
    }

    const response = await aiApi.post('/ai/diagnose', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSafetyGuide: async (category: string) => {
    const response = await aiApi.get(`/ai/safety-guide/${category}`);
    return response.data;
  },
};
