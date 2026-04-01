using Capstone_2_BE.DTOs.Technician.Profile;
using Capstone_2_BE.Repositories.Technician;
using Capstone_2_BE.Settings;

namespace Capstone_2_BE.Services.Technician
{
    public class TechnicianProfileService
    {
        private readonly ITechnicianProfileRepo _technicianProfileRepo;
        private readonly AWS _aws;
        private readonly ILogger<TechnicianProfileService> _logger;

        public TechnicianProfileService(ITechnicianProfileRepo technicianProfileRepo, AWS aws, ILogger<TechnicianProfileService> logger)
        {
            _technicianProfileRepo = technicianProfileRepo;
            _aws = aws;
            _logger = logger;
        }

        public async Task<Result<TechnicianProfileViewDTO>> GetTechnicianProfile(Guid technicianId)
        {
            try
            {
                var profile = await _technicianProfileRepo.GetTechnicianProfile(technicianId);
                if (profile == null)
                {
                    return Result<TechnicianProfileViewDTO>.Failure("Không tìm thấy thông tin kỹ thuật viên", 404);
                }

                // Nếu có avatar URL (key từ S3), convert sang public URL
                if (!string.IsNullOrEmpty(profile.AvatarURL))
                {
                    profile.AvatarURL = await _aws.ReadImage(profile.AvatarURL);
                }

                return Result<TechnicianProfileViewDTO>.Success(profile, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician profile for ID: {TechnicianId}", technicianId);
                return Result<TechnicianProfileViewDTO>.Failure("Lỗi khi lấy thông tin kỹ thuật viên", 500);
            }
        }

        public async Task<Result<string>> UpdateTechnicianProfile(TechnicianProfileUpdateDTO updateDTO)
        {
            try
            {
                // Tạo DTO để gửi xuống DAL
                var dalDTO = new TechnicianProfileUpdateDALDTO
                {
                    Id = updateDTO.Id,
                    FullName = updateDTO.FullName,
                    PhoneNumber = updateDTO.PhoneNumber,
                    Address = updateDTO.Address,
                    CityId = updateDTO.CityId,
                    Latitude = updateDTO.Latitude,
                    Longitude = updateDTO.Longitude,
                    ServiceId = updateDTO.ServiceId,
                    Description = updateDTO.Description,
                    Experiences = updateDTO.Experiences
                };

                // Xử lý upload avatar nếu có
                if (updateDTO.AvatarURl != null)
                {
                    // Lấy avatar cũ để xóa (nếu có)
                    var oldProfile = await _technicianProfileRepo.GetOldAvatar(updateDTO.Id);

                    // Upload avatar mới lên S3
                    var avatarKey = await _aws.UploadProfile(updateDTO.AvatarURl);
                    if (string.IsNullOrEmpty(avatarKey))
                    {
                        return Result<string>.Failure("Upload ảnh đại diện thất bại", 400);
                    }

                    dalDTO.AvatarURl = avatarKey;

                    // Xóa avatar cũ từ S3 (nếu có)
                    if (oldProfile != null && !string.IsNullOrEmpty(oldProfile))
                    {
                        await _aws.DeleteImage(oldProfile);
                    }
                }

                var result = await _technicianProfileRepo.UpdateTechnicianProfile(dalDTO);
                // Cập nhật profile
               
                if (result)
                {
                    return Result<string>.Success("Cập nhật thông tin kỹ thuật viên thành công", 200);
                }
                else
                {
                    return Result<string>.Failure("Cập nhật thông tin kỹ thuật viên thất bại", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating technician profile for ID: {TechnicianId}", updateDTO.Id);
                return Result<string>.Failure("Lỗi khi cập nhật thông tin kỹ thuật viên", 500);
            }
        }
    }
}
