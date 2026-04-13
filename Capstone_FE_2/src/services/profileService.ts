import api from './api';

export interface UpdateProfileDTO {
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

  updateCustomerProfile: async (data: UpdateProfileDTO, avatarFile?: File) => {
    const formData = new FormData();
    formData.append('FullName', data.fullName || '');
    formData.append('PhoneNumber', data.phoneNumber || '');
    formData.append('Address', data.address || '');
    formData.append('Description', data.description || '');
    if (avatarFile) {
      formData.append('AvatarFile', avatarFile);
    }

    const res = await api.put('/customer/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default profileService;
