using Capstone_2_BE.DTOs.ChatRealTime;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;

namespace Capstone_2_BE.DALs
{
    public class ChatRealTimeDAL : IChatRealTimeRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ChatRealTimeDAL> _logger;

        public ChatRealTimeDAL(AppDbContext context, ILogger<ChatRealTimeDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<ViewAllMessageDTO>> GetAllMessages(Guid RoomId, int page, int pageSize)
        {
            try
            {
                // B1: Lấy messages + role (1 query)
                var messages = await (
                from m in _context.MessengerModel
                join u in _context.AccountsModel on m.SenderId equals u.Id
                join ma in _context.MessAttachmentModel on m.Id equals ma.MessageId into maGroup
                from ma in maGroup.DefaultIfEmpty()
                where m.RoomId == RoomId
                orderby m.CreateAt ascending
                select new
                {
                    m.Id,
                    m.Content,
                    m.SenderId,
                    u.Role,
                    FileType = ma != null ? ma.FileType : null,
                    FileName = ma != null ? ma.FileName : null,
                    m.CreateAt
                }
            )
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
                // B2: lấy danh sách senderId
                var senderIds = messages.Select(x => x.SenderId).Distinct().ToList();

                // B3: load profile theo batch (2 query)
                var techProfiles = await _context.TechnicianProfileModel
                    .Where(x => senderIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.AvatarURl
                    })
                    .ToListAsync();

                var customerProfiles = await _context.CustomerProfileModel
                    .Where(x => senderIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.AvatarURL
                    })
                    .ToListAsync();

                // B4: convert sang dictionary
                var techDict = techProfiles.ToDictionary(x => x.Id);
                var customerDict = customerProfiles.ToDictionary(x => x.Id);

                // B5: map ra DTO (không query DB nữa)
                var result = new List<ViewAllMessageDTO>();

                foreach (var msg in messages)
                {
                    string senderName = "";
                    string avatar = "";

                    if (msg.Role == "Technician")
                    {
                        if (techDict.ContainsKey(msg.SenderId))
                        {
                            var tech = techDict[msg.SenderId];
                            senderName = tech.FullName;
                            avatar = tech.AvatarURl;
                        }
                    }
                    else
                    {
                        if (customerDict.ContainsKey(msg.SenderId))
                        {
                            var cus = customerDict[msg.SenderId];
                            senderName = cus.FullName;
                            avatar = cus.AvatarURL;
                        }
                    }
                    ViewAllMessageDTO dto = new ViewAllMessageDTO
                    {
                        MessengerId = msg.Id,
                        Content = msg.Content,
                        SenderId = msg.SenderId,
                        SentTime = msg.CreateAt,
                        SenderName = senderName,
                        AvatarUrl = avatar,
                        ImageUrls = msg.FileType == "Image" ? new List<string> { msg.FileName } : new List<string>(),
                        videoUrl = msg.FileType == "Video" ? msg.FileName : null
                    };
                    result.Add(dto);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all messages for RoomId: {RoomId}", RoomId);
                return new List<ViewAllMessageDTO>();
            }
        }
        public async Task<List<ViewAllRoomDTO>> GetAllRooms(Guid AccountId, int page, int pageSize)
        {
            try
            {
                // bước 1 lấy tất cả room của accountID ( kể cả nó là sender hay receiver)
                // bước 2 lấy thông tin user mà accountId đang chat ( lấy role từ role => fullname và avatar)
                // bước 3 lấy last message và last message time
                // bước 4 sắp xếp theo last message time
                // bước 5 phân trang để ko lấy hết
                // bước 6 trả về ab ac da
                var rawRooms = await (from r in _context.RoomsModel
                                  let otherId = r.SenderId == AccountId ? r.ReceiverId : r.SenderId
                                  join ua in _context.AccountsModel on otherId equals ua.Id
                                  join tp in _context.TechnicianProfileModel on otherId equals tp.Id into tpGroup
                                  from tp in tpGroup.DefaultIfEmpty()
                                  join cp in _context.CustomerProfileModel on otherId equals cp.Id into cpGroup
                                  from cp in cpGroup.DefaultIfEmpty()
                                  where r.SenderId == AccountId || r.ReceiverId == AccountId
                                  select new ViewAllRoomDTO
                                  {
                                        RoomId = r.Id,
                                        OtherId = otherId,
                                        UserName = ua.Role == "Technician" ? (tp != null ? tp.FullName : ua.Email) : (cp != null ? cp.FullName : ua.Email),
                                        AvatarUrl = ua.Role == "Technician" ? (tp != null ? tp.AvatarURl : null) : (cp != null ? cp.AvatarURL : null),
                                        LastMessage = r.LastMessage,
                                        LastMessageTime = r.LastMessageTime
                                  })
                                  .ToListAsync();

                var rooms = rawRooms
                    .GroupBy(x => x.OtherId)
                    .Select(g => g.OrderByDescending(x => x.LastMessageTime).ThenByDescending(x => x.RoomId).First())
                    .OrderByDescending(x => x.LastMessageTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();
                _logger.LogInformation("Successfully retrieved {Count} rooms for AccountId: {AccountId}", rooms.Count, AccountId);
                return rooms;
            }
            catch(Exception ex)
            {
                _logger.LogError(ex, "Error getting all rooms for AccountId: {AccountId}", AccountId);
                return new List<ViewAllRoomDTO>();
            }
        }

        public async Task<Guid> GetOrCreateRoom(Guid userA, Guid userB)
        {
            try
            {
                if(userA == userB)
                {
                    _logger.LogWarning("Attempted to get or create room for the same user: {UserA}", userA);
                    return Guid.Empty;
                }

                var minId = userA.CompareTo(userB) < 0 ? userA : userB;
                var maxId = userA.CompareTo(userB) < 0 ? userB : userA;

                var existingRoom = await _context.RoomsModel.FirstOrDefaultAsync(r => r.SenderId == minId && r.ReceiverId == maxId);

                if (existingRoom != null)
                    return existingRoom.Id;

                var newRoom = new RoomsModel
                {
                    SenderId = minId,
                    ReceiverId = maxId,
                    LastMessage = null,
                    LastMessageTime = DateTime.MinValue,
                    CreateAt = DateTime.Now
                };
                _context.RoomsModel.Add(newRoom);
                await _context.SaveChangesAsync();
                return newRoom.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting or creating room for UserA: {UserA}, UserB: {UserB}", userA, userB);
               return Guid.Empty;
            }
        }

        public async Task<InsertResDTO> InsertMessage(CreateMessageDTO createMessageDTO)
        {
            try
            {
                using(var transaction = _context.Database.BeginTransaction())
                {
                    try
                    {
                        string? avatar = null;
                        var Role = await _context.AccountsModel
                            .Where(a => a.Id == createMessageDTO.SenderId)
                            .Select(a => a.Role)
                            .FirstOrDefaultAsync();
                        if (Role == "Technician" )
                        {
                             avatar = await _context.TechnicianProfileModel
                                .Where(t => t.Id == createMessageDTO.SenderId)
                                .Select(t => t.AvatarURl)
                                .FirstOrDefaultAsync();
                        }
                        else
                        {
                             avatar = await _context.CustomerProfileModel
                                .Where(c => c.Id == createMessageDTO.SenderId)
                                .Select(c => c.AvatarURL)
                                .FirstOrDefaultAsync();
                        }
                        MessengerModel newMess = new MessengerModel
                        {
                            RoomId = createMessageDTO.RoomId,
                            SenderId = createMessageDTO.SenderId,
                            Content = createMessageDTO.Content,
                            IsRead = false,
                            CreateAt = DateTime.Now
                        };
                        await _context.MessengerModel.AddAsync(newMess);
                        await _context.SaveChangesAsync();

                        if(createMessageDTO.ImageUrls != null && createMessageDTO.ImageUrls.Count > 0)
                        {
                            var attachments = createMessageDTO.ImageUrls.Select(url => new MessAttachmentModel
                            {
                                MessageId = newMess.Id,
                                FileName = url,
                                FileType = "Image",
                                CreateAt = DateTime.Now
                            }).ToList();
                            await _context.MessAttachmentModel.AddRangeAsync(attachments);
                            await _context.SaveChangesAsync();
                        }
                        if(!string.IsNullOrEmpty(createMessageDTO.VideoUrl))
                        {
                            MessAttachmentModel videoAttachment = new MessAttachmentModel
                            {
                                MessageId = newMess.Id,
                                FileName = createMessageDTO.VideoUrl,
                                FileType = "Video",
                                CreateAt = DateTime.Now
                            };
                            await _context.MessAttachmentModel.AddAsync(videoAttachment);
                            await _context.SaveChangesAsync();
                        }
                        int UpdateLastMessage = await _context.RoomsModel
                            .Where(r => r.Id == createMessageDTO.RoomId)
                            .ExecuteUpdateAsync(r => r.SetProperty(room => room.LastMessage, newMess.Content)
                                                      .SetProperty(room => room.LastMessageTime, newMess.CreateAt));
                        InsertResDTO newOutput = new InsertResDTO
                        {
                            MessengerId = newMess.Id,
                            RoomId = newMess.RoomId,
                            SenderId = newMess.SenderId,
                            Content = newMess.Content,
                            VideoUrl = createMessageDTO.VideoUrl,
                            ImageUrls = createMessageDTO.ImageUrls,
                            AvatarUrl = avatar
                        };
                        if (UpdateLastMessage > 0)
                        {
                            await transaction.CommitAsync();
                            return newOutput;
                        }
                        else
                        {
                            _logger.LogWarning("Failed to update last message for RoomId: {RoomId} after inserting message for SenderId: {SenderId}", createMessageDTO.RoomId, createMessageDTO.SenderId);
                            await transaction.RollbackAsync();
                            return null;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during transaction for inserting message for RoomId: {RoomId}, SenderId: {SenderId}", createMessageDTO.RoomId, createMessageDTO.SenderId);
                        await transaction.RollbackAsync();
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting message for RoomId: {RoomId}, SenderId: {SenderId}", createMessageDTO.RoomId, createMessageDTO.SenderId);
                return null;
            }
        }

        public async Task<bool> MarkAsRead(Guid roomId, Guid AccountId)
        {
            try
            {
                int IsUpdate = await _context.MessengerModel
                    .Where(m => m.RoomId == roomId && m.SenderId == AccountId && !m.IsRead)
                    .ExecuteUpdateAsync(m => m.SetProperty(msg => msg.IsRead, true));
                if (IsUpdate > 0)
                {
                    _logger.LogInformation("Marked {Count} messages as read for RoomId: {RoomId}, AccountId: {AccountId}", IsUpdate, roomId, AccountId);
                    return true;
                }
                else
                {
                    _logger.LogInformation("No messages to mark as read for RoomId: {RoomId}, AccountId: {AccountId}", roomId, AccountId);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking messages as read for RoomId: {RoomId}, AccountId: {AccountId}", roomId, AccountId);
                return false;
            }
        }
    }
}
