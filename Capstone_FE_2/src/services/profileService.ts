import api from './api';

export interface UpdateProfileDTO {
  fullName: string;
  phoneNumber: string;
}

const profileService = {
  getCustomerProfile: async (customerId: string) => {
    const res = await api.get(`/customer/profile/${customerId}`);
    return res.data;
  },

  updateCustomerProfile: async (customerId: string, data: UpdateProfileDTO, avatarFile?: File) => {
    const formData = new FormData();
    formData.append('Id', customerId);
    formData.append('FullName', data.fullName || '');
    formData.append('PhoneNumber', data.phoneNumber || '');
    if (avatarFile) {
      formData.append('AvatarURl', avatarFile);
    }

    const res = await api.put('/customer/profile', formData);
    return res.data;
  }
};

export default profileService;
