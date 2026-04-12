using Capstone_2_BE.DTOs.ChatRealTime;

namespace Capstone_2_BE.Repositories
{
    public interface IChatRealTimeRepo
    {
        Task<InsertResDTO> InsertMessage(CreateMessageDTO createMessageDTO);
        Task<List<ViewAllRoomDTO>> GetAllRooms(Guid AccountId, int page, int pageSize);
        Task<Guid> GetOrCreateRoom(Guid userA, Guid userB);
        Task<List<ViewAllMessageDTO>> GetAllMessages(Guid RoomId, int page, int pageSize);
        Task<bool> MarkAsRead(Guid roomId, Guid AccountId);
    }
}
