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
                // Lấy tất cả room có account hiện tại tham gia, dedupe theo đối tác (1 đối tác = 1 room mới nhất)
                var rawRooms = await (from r in _context.RoomsModel
                                      let otherId = r.SenderId == AccountId ? r.ReceiverId : r.SenderId
                                      where r.SenderId == AccountId || r.ReceiverId == AccountId
                                      select new
                                      {
                                          r.Id,
                                          OtherId = otherId,
                                          r.LastMessage,
                                          r.LastMessageTime,
                                          r.CreateAt
                                      })
                                      .ToListAsync();

                if (rawRooms.Count == 0)
                {
                    return new List<ViewAllRoomDTO>();
                }

                var otherIds = rawRooms.Select(x => x.OtherId).Distinct().ToList();

                var techProfiles = await _context.TechnicianProfileModel
                    .Where(t => otherIds.Contains(t.Id))
                    .Select(t => new { t.Id, t.FullName, AvatarUrl = t.AvatarURl })
                    .ToListAsync();

                var customerProfiles = await _context.CustomerProfileModel
                    .Where(c => otherIds.Contains(c.Id))
                    .Select(c => new { c.Id, c.FullName, c.AvatarURL })
                    .ToListAsync();

                var techDict = techProfiles.ToDictionary(x => x.Id, x => new { x.FullName, x.AvatarUrl });
                var customerDict = customerProfiles.ToDictionary(x => x.Id, x => new { x.FullName, AvatarUrl = x.AvatarURL });

                var deduped = rawRooms
                    .GroupBy(x => x.OtherId)
                    .Select(g => g
                        .OrderByDescending(x => x.LastMessageTime)
                        .ThenByDescending(x => x.CreateAt)
                        .First())
                    .OrderByDescending(x => x.LastMessageTime)
                    .ThenByDescending(x => x.CreateAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(x =>
                    {
                        string userName = "Người dùng";
                        string? avatarUrl = null;

                        if (techDict.TryGetValue(x.OtherId, out var tech))
                        {
                            userName = tech.FullName;
                            avatarUrl = tech.AvatarUrl;
                        }
                        else if (customerDict.TryGetValue(x.OtherId, out var customer))
                        {
                            userName = customer.FullName;
                            avatarUrl = customer.AvatarUrl;
                        }

                        return new ViewAllRoomDTO
                        {
                            RoomId = x.Id,
                            OtherId = x.OtherId,
                            UserName = userName,
                            AvatarUrl = avatarUrl,
                            LastMessage = x.LastMessage,
                            LastMessageTime = x.LastMessageTime
                        };
                    })
                    .ToList();

                _logger.LogInformation("Successfully retrieved {Count} deduped rooms for AccountId: {AccountId}", deduped.Count, AccountId);
                return deduped;
            }
            catch (Exception ex)
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

                var existingRoom = await _context.RoomsModel
                    .Where(r => r.SenderId == minId && r.ReceiverId == maxId)
                    .OrderByDescending(r => r.LastMessageTime)
                    .ThenByDescending(r => r.CreateAt)
                    .FirstOrDefaultAsync();

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
