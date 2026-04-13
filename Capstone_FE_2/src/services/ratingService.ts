import api from './api';

export interface CreateRatingDTO {
  customerId: string;
  technicianId: string;
  orderId: string;
  score: number;
  feedback: string;
}

export interface UpdateRatingDTO {
  feedbackId: string;
  score: number;
  feedback: string;
}

const ratingService = {
  createRating: async (data: CreateRatingDTO) => {
    const res = await api.post('/customer/rating/create', data);
    return res.data;
  },

  getCustomerRatings: async (customerId: string) => {
    const res = await api.get(`/customer/rating/view/${customerId}`);
    return res.data;
  },

  isFeedback: async (orderId: string) => {
    const res = await api.get(`/customer/rating/is-feedback/${orderId}`);
    return res.data;
  },

  viewRatings: async (customerId: string) => {
    const res = await api.get(`/customer/rating/view/${customerId}`);
    return res.data;
  },

  updateRating: async (data: UpdateRatingDTO) => {
    const res = await api.put('/customer/rating/update', data);
    return res.data;
  },

  deleteRating: async (feedbackId: string) => {
    const res = await api.delete(`/customer/rating/delete/${feedbackId}`);
    return res.data;
  }
};

export default ratingService;
