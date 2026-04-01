using Capstone_2_BE.DTOs.Technician.Profile;

namespace Capstone_2_BE.Repositories.Technician
{
    public interface ITechnicianProfileRepo
    {
        Task<TechnicianProfileViewDTO> GetTechnicianProfile(Guid technicianId);
        Task<bool> UpdateTechnicianProfile(TechnicianProfileUpdateDALDTO technicianProfileUpdateDTO);
        Task<string> GetOldAvatar(Guid technicianId);
    }
}
