using Capstone_2_BE.DTOs.Customer.AutoFind;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Settings;
using Capstone_2_BE.DTOs.Customer.Order;

namespace Capstone_2_BE.Services.Customer
{
    public class CustomerAutoFindService
    {
        private readonly ICustomerAutoFindRepo _customerAutoFindRepo;
        private readonly ILogger<CustomerAutoFindService> _logger;
        private readonly Redis _redis;
        private readonly AWS _aws;

        public CustomerAutoFindService(ICustomerAutoFindRepo customerAutoFindRepo, ILogger<CustomerAutoFindService> logger, Redis redis, AWS aws)
        {
            _customerAutoFindRepo = customerAutoFindRepo;
            _logger = logger;
            _redis = redis;
            _aws = aws;
        }

        public double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double R = 6371; // Radius of Earth (km)

            double dLat = (double)(lat2 - lat1) * Math.PI / 180.0;
            double dLon = (double)(lon2 - lon1) * Math.PI / 180.0;

            double lat1Rad = (double)lat1 * Math.PI / 180.0;
            double lat2Rad = (double)lat2 * Math.PI / 180.0;

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;

        }

        public async Task<Result<string>> AutoFindTechnician(Guid CustomerId, AutoFindFixerDTO autoFindFixerDTO)
        {
            try
            {
                var technicians = await _customerAutoFindRepo.AutoFindCustomer(autoFindFixerDTO);
                if (technicians == null)
                {
                    _logger.LogWarning("No technicians found for City: {City} and ServiceId: {ServiceId}", autoFindFixerDTO.CityId, autoFindFixerDTO.ServiceId);
                    return Result<string>.Failure("No technicians found in your area for the selected service.", 400);
                }
                foreach (var tech in technicians)
                {
                    decimal distance = (decimal)CalculateDistance(autoFindFixerDTO.Latitude, autoFindFixerDTO.Longitude, tech.Latitude, tech.Longitude);
                    tech.Total = tech.Total + distance;
                }
                var sortedTechnicians = technicians.OrderBy(t => t.Total).ToList();
                var key = $"AutoFindTechnician:{CustomerId}";
                var isCached = await _redis.PushListAsync(key, sortedTechnicians);
                return Result<string>.Success("Technicians found and cached successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AutoFindCustomer for City: {City} and ServiceId: {ServiceId}", autoFindFixerDTO.CityId, autoFindFixerDTO.ServiceId);
                return Result<string>.Failure("An error occurred while trying to find technicians. Please try again later.", 500);
            }
        }
        public async Task<Result<AutoFindFixerResSuccessDTO>> GetFirstTechnician(Guid CustomerId)
        {
            try
            {
                var key = $"AutoFindTechnician:{CustomerId}";
                var firstTechnicianJson = await _redis.PopFirstAsync(key);
                if (firstTechnicianJson == null)
                {
                    _logger.LogWarning("No technicians available in cache for CustomerId: {CustomerId}", CustomerId);
                    return Result<AutoFindFixerResSuccessDTO>.Failure("No technicians available at the moment. Please try again later.", 400);
                }
                var acceptedTechnician = System.Text.Json.JsonSerializer.Deserialize<AutoFindFixerResDTO>(firstTechnicianJson);
                AutoFindFixerResSuccessDTO techinician = new AutoFindFixerResSuccessDTO
                {

                    FullName = acceptedTechnician.FullName,
                    avatarURL = acceptedTechnician.avatarURL,
                    ServiceName = acceptedTechnician.ServiceName,
                    Score = acceptedTechnician.AvgScore,
                    OrderCount =  acceptedTechnician.OrderCount,
                    RatingCount = acceptedTechnician.RatingCount
                };
                techinician.avatarURL = await _aws.ReadImage(acceptedTechnician.avatarURL);
                return Result<AutoFindFixerResSuccessDTO>.Success(techinician, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AcceptTechnician for CustomerId: {CustomerId}", CustomerId);
                return Result<AutoFindFixerResSuccessDTO>.Failure("An error occurred while accepting the technician. Please try again later.", 500);
            }
        }

        public async Task<Result<string>> ClearTechnicianCache(Guid CustomerId)
        {
            try
            {
                var key = $"AutoFindTechnician:{CustomerId}";
                await _redis.DeleteKeyAsync(key);
                return Result<string>.Success("Technician cache cleared successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing technician cache for CustomerId: {CustomerId}", CustomerId);
                return Result<string>.Failure("An error occurred while clearing the technician cache. Please try again later.", 500);
            }
        }

        public async Task<Result<bool>> PlaceAutoOrder(CreateOrderFormDTO form)
        {
            try
            {
                var dalDto = new CreateOrderDALDTO
                {
                    CustomerId = form.CustomerId,
                    TechnicianId = form.TechnicianId,
                    ServiceId = form.ServiceId,
                    Title = form.Title,
                    Description = form.Description,
                    Address = form.Address,
                    CityId = form.CityId,
                    Latitude = form.Latitude,
                    Longitude = form.Longitude,
                    ImageOrderUrl = new List<string>(),
                    videoUrl = string.Empty
                };

                // Upload video if present
                if (form.VideoFile != null)
                {
                    var videoKey = await _aws.UploadVideoOrder(form.VideoFile);
                    if (string.IsNullOrEmpty(videoKey))
                    {
                        return Result<bool>.Failure("Upload video thất bại", 400);
                    }
                    dalDto.videoUrl = videoKey;
                }

                // Upload images
                if (form.ImageFiles != null && form.ImageFiles.Count > 0)
                {
                    foreach (var file in form.ImageFiles)
                    {
                        var key = await _aws.UploadImageOrder(file);
                        if (!string.IsNullOrEmpty(key))
                        {
                            dalDto.ImageOrderUrl.Add(key);
                        }
                    }
                }

                var ok = await _customerAutoFindRepo.PlaceAutoOrder(dalDto);
                if (ok) return Result<bool>.Success(true, 200);
                return Result<bool>.Failure("Đặt đơn tự động thất bại", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error placing auto order for customer {CustomerId}", form.CustomerId);
                return Result<bool>.Failure("Lỗi khi đặt đơn tự động", 500);
            }
        }
    }
}