using Capstone_2_BE.DTOs.Customer.Profile;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Settings;

namespace Capstone_2_BE.Services.Customer
{
    public class CustomerProfileService
    {
        private readonly ICustomerProfileRepo _customerProfileRepo;
        private readonly AWS _aws;
        private readonly ILogger<CustomerProfileService> _logger;

        public CustomerProfileService(ICustomerProfileRepo customerProfileRepo, AWS aws, ILogger<CustomerProfileService> logger)
        {
            _customerProfileRepo = customerProfileRepo;
            _aws = aws;
            _logger = logger;
        }

        public async Task<Result<CustomerProfileViewDTO>> GetCustomerProfile(Guid customerId)
        {
            try
            {
                var profile = await _customerProfileRepo.GetCustomerProfile(customerId);
                if (profile == null)
                {
                    return Result<CustomerProfileViewDTO>.Failure("Không tìm th?y thông tin khách hàng", 404);
                }

                // N?u có avatar URL (key t? S3), convert sang public URL
                if (!string.IsNullOrEmpty(profile.AvatarURL))
                {
                    profile.AvatarURL = await _aws.ReadImage(profile.AvatarURL);
                }

                return Result<CustomerProfileViewDTO>.Success(profile, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer profile for ID: {CustomerId}", customerId);
                return Result<CustomerProfileViewDTO>.Failure("L?i khi l?y thông tin khách hàng", 500);
            }
        }

        public async Task<Result<string>> UpdateCustomerProfile(CustomerProfileUpdateDTO updateDTO)
        {
            try
            {
                // T?o DTO ?? g?i xu?ng DAL
                var dalDTO = new CustomerProfileUpdateDALDTO
                {
                    Id = updateDTO.Id,
                    FullName = updateDTO.FullName,
                    PhoneNumber = updateDTO.PhoneNumber
                };

                // X? lý upload avatar n?u có
                if (updateDTO.AvatarURl != null)
                {
                    // L?y avatar c? ?? xóa (n?u có)
                    var oldAvatar = await _customerProfileRepo.GetOldAvatar(updateDTO.Id);
                    
                    // Upload avatar m?i lên S3
                    var avatarKey = await _aws.UploadProfile(updateDTO.AvatarURl);
                    if (string.IsNullOrEmpty(avatarKey))
                    {
                        return Result<string>.Failure("Upload ?nh ??i di?n th?t b?i", 400);
                    }

                    dalDTO.AvatarURl = avatarKey;

                    // Xóa avatar c? t? S3 (n?u có)
                    if (!string.IsNullOrEmpty(oldAvatar))
                    {
                        await _aws.DeleteImage(oldAvatar);
                    }
                }

                // C?p nh?t profile
                var result = await _customerProfileRepo.UpdateTechnicianProfile(dalDTO);
                if (result)
                {
                    return Result<string>.Success("C?p nh?t thông tin khách hàng thành công", 200);
                }
                else
                {
                    return Result<string>.Failure("C?p nh?t thông tin khách hàng th?t b?i", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer profile for ID: {CustomerId}", updateDTO.Id);
                return Result<string>.Failure("L?i khi c?p nh?t thông tin khách hàng", 500);
            }
        }
    }
}
