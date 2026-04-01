import api from './api';

export interface UpdateProfileDTO {
  id: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  description?: string;
}

const profileService = {
  getCustomerProfile: async (customerId: string) => {
    const res = await api.get(`/customer/profile/${customerId}`);
    return res.data;
  },

  updateCustomerProfile: async (data: UpdateProfileDTO) => {
    const formData = new FormData();
    formData.append('Id', data.id);
    if (data.fullName) formData.append('FullName', data.fullName);
    if (data.phoneNumber) formData.append('PhoneNumber', data.phoneNumber);
    if (data.address) formData.append('Address', data.address);
    if (data.description) formData.append('Description', data.description);

    const res = await api.put('/customer/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default profileService;
