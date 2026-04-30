using Capstone_2_BE.DTOs.Authentication;
using Capstone_2_BE.Enums;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Repositories.Technician;
using Capstone_2_BE.Securities;
using Capstone_2_BE.Settings;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Globalization;

namespace Capstone_2_BE.DALs
{
    public class AuthenticationDAL : IAuthenticationRepo
    {
        public readonly AppDbContext _context;
        public readonly ILogger<AuthenticationDAL> _logger;
        public readonly Token _token;
        public readonly Redis _redis;

        public AuthenticationDAL(AppDbContext context, ILogger<AuthenticationDAL> logger, Token token, Redis redis)
        {
            _context = context;
            _logger = logger;
            _token = token;
            _redis = redis;
        }
        public static string GenerateIdUnique(DateTime createAt)
        {
            string random = new Random().Next(1000, 9999).ToString(); // tạo số ngẫu nhiên 4 chữ số
            string dateCode = createAt.ToString("yyyyMMdd"); // lấy ngày-tháng-năm
            return $"{random}{dateCode}"; // ghép thành chuỗi
        }
        public async Task<bool> ChangePassword(ChangePasswordDTO changePasswordDTO)
        {
            try
            {
                var user = await _context.AccountsModel.FirstOrDefaultAsync(u => u.Id == changePasswordDTO.Id);
                if (user == null)
                {

                    return false;
                }
                bool checkOldPassword = Hash.VerifyPassword(changePasswordDTO.OldPassword, user.Password);
                if (!checkOldPassword)
                {

                    return false;
                }
                string newHashedPassword = Hash.HashPassword(changePasswordDTO.NewPassword);
                int updated = await _context.AccountsModel
                                     .Where(u => u.Id == changePasswordDTO.Id)
                                     .ExecuteUpdateAsync(s => s
                                         .SetProperty(u => u.Password, newHashedPassword)
                                         .SetProperty(u => u.UpdateAt, DateTime.Now)
                                     );
                if (updated > 0)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> ForgetPassword(string Email, string password)
        {
            try
            {
                int isUpdatePass = await _context.AccountsModel.Where(a => a.Email == Email).ExecuteUpdateAsync(s => s.SetProperty(u => u.Password, password)
                .SetProperty(u => u.UpdateAt, DateTime.Now));
                if (isUpdatePass > 0)
                {
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        public async Task<Guid?> isEmailExist(string email)
        {
            try
            {
                var isEmail = await _context.AccountsModel.FirstOrDefaultAsync(u => u.Email == email);
                if (isEmail != null)
                {

                    return isEmail.Id;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if email exists for '{Email}'.", email);
                return null;
            }
        }

        public async Task<LoginResponseDTO> Login(string email, string password)
        {
            try
            {
                var isExsist = await _context.AccountsModel.Where(a => a.Email == email).FirstOrDefaultAsync();
                if (isExsist == null)
                {
                    return new LoginResponseDTO()
                    {
                        LoginStatus = AuthenticationEnum.Login.Wrong,
                    };
                }
                if (isExsist.IsActive == 0)
                {
                    return new LoginResponseDTO()
                    {
                        LoginStatus = AuthenticationEnum.Login.Banned,
                    };
                }
                bool checkPassword = Hash.VerifyPassword(password, isExsist.Password);
                if (!checkPassword)
                {
                    return new LoginResponseDTO()
                    {
                        LoginStatus = AuthenticationEnum.Login.Wrong,
                    };
                }
                int isOnline = await _context.AccountsModel.Where(a => a.Id == isExsist.Id).ExecuteUpdateAsync(s => s.SetProperty(u => u.IsOnline, 1));
                return new LoginResponseDTO()
                {
                    Id = isExsist.Id,
                    Role = isExsist.Role,
                    Email = email,
                    LoginStatus = AuthenticationEnum.Login.Success
                };
            }
            catch (Exception ex)
            {
                return new LoginResponseDTO()
                {
                    LoginStatus = AuthenticationEnum.Login.Fail,
                };
            }
        }
        public async Task<bool> RegisterAccountAdmin(string email, string passwordHash)
        {
            try
            {

                AccountsModel newAccountAdmin = new AccountsModel()
                {
                    Email = email,
                    Password = Hash.HashPassword(passwordHash),
                    Role = "Admin",
                    IsActive = 1,
                    IsOnline = 1,
                    CreateAt = DateTime.Now,
                };
                await _context.AccountsModel.AddAsync(newAccountAdmin);
                await _context.SaveChangesAsync();
                return true;
            }
            catch(Exception ex)
            {
                return false;
            }
        }

        public async Task<AuthenticationEnum.Register> RegisterCustomer(RegisterCustomerDTO authRegisterDTO)
        {
            try
            {
                var passwordHash = Hash.HashPassword(authRegisterDTO.Password);
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        string avatarURL = "profile/Default.jpg";
                        AccountsModel newAccount = new AccountsModel()
                        {
                            Email = authRegisterDTO.Email,
                            Password = passwordHash,
                            Role = "Customer",
                            IsActive = 1,
                            CreateAt = DateTime.Now,
                            IsOnline= 1,
                        };

                        await _context.AccountsModel.AddAsync(newAccount);
                        await _context.SaveChangesAsync();

                        string UniqueId = GenerateIdUnique(newAccount.CreateAt);
                        CustomerProfileModel newCustomerProfile = new CustomerProfileModel()
                        {
                            Id = newAccount.Id,
                            FullName = authRegisterDTO.FullName,
                            PhoneNumber = authRegisterDTO.PhoneNumber,
                            AvatarURL = avatarURL,
                            IdUnique = UniqueId,
                            CreateAt = DateTime.Now,
                        };

                        await _context.CustomerProfileModel.AddAsync(newCustomerProfile);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();

                        return AuthenticationEnum.Register.Success;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RegisterCustomer");
                return AuthenticationEnum.Register.Fail;
            }
        }

        public async Task<AuthenticationEnum.Register> RegisterTechnician(RegisterFixerDTO authRegisterDTO)
        {

            try
            {

                string avatarURL = "profile/Default.jpg";
                var passwordHash = Hash.HashPassword(authRegisterDTO.Password);
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        AccountsModel newAccount = new AccountsModel()
                        {
                            Email = authRegisterDTO.Email,
                            Password = passwordHash,
                            Role = "Technician",
                            IsActive = 1,
                            IsOnline = 1,
                            CreateAt = DateTime.Now,
                        };

                        await _context.AccountsModel.AddAsync(newAccount);
                        await _context.SaveChangesAsync();

                        string UniqueId = GenerateIdUnique(newAccount.CreateAt);


                        decimal? lat = null;
                        decimal? lng = null;

                        if (!string.IsNullOrWhiteSpace(authRegisterDTO.Latitude) && !string.IsNullOrWhiteSpace(authRegisterDTO.Longitude))
                        {
                            if (!decimal.TryParse(authRegisterDTO.Latitude, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedLat))
                                return AuthenticationEnum.Register.Fail;

                            if (!decimal.TryParse(authRegisterDTO.Longitude, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedLng))
                                return AuthenticationEnum.Register.Fail;

                            if (parsedLat < -90 || parsedLat > 90)
                                return AuthenticationEnum.Register.Fail;

                            if (parsedLng < -180 || parsedLng > 180)
                                return AuthenticationEnum.Register.Fail;

                            lat = parsedLat;
                            lng = parsedLng;
                        }
                        TechnicianProfileModel newTechnicianProfile = new TechnicianProfileModel()
                        {
                            Id = newAccount.Id,
                            FullName = authRegisterDTO.FullName,
                            PhoneNumber = authRegisterDTO.PhoneNumber,
                            IdUnique = UniqueId,
                            AvatarURl = avatarURL,
                            Address = authRegisterDTO.Address,
                            CityId = authRegisterDTO.CityId,
                            Latitude = lat,
                            Longitude = lng,
                            CreateAt = DateTime.Now,
                        };

                        await _context.TechnicianProfileModel.AddAsync(newTechnicianProfile);
                        await _context.SaveChangesAsync();

                        RatingModel ratingModel = new RatingModel()
                        {
                            TechnicianId = newAccount.Id,
                            CustomerId = null,
                            Score = 5,
                            Feedback = "Đánh giá cho người mới",
                            CreateAt = DateTime.Now,
                            UpdateAt = DateTime.Now,
                        };

                        await _context.RatingModel.AddAsync(ratingModel);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();

                        return AuthenticationEnum.Register.Success;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RegisterTechnician");
                return AuthenticationEnum.Register.Fail;
            }
        }

        public async Task<bool> UpdateOnlineStatus(Guid accountId, int isOnline)
        {
            try
            {
                int updated = await _context.AccountsModel
                    .Where(a => a.Id == accountId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(u => u.IsOnline, isOnline)
                        .SetProperty(u => u.UpdateAt, DateTime.Now)
                    );

                if (updated > 0)
                {
                    _logger.LogInformation("Updated online status for account {AccountId} to {IsOnline}", accountId, isOnline);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Account {AccountId} not found for online status update", accountId);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating online status for account {AccountId}", accountId);
                return false;
            }
        }

        public async Task<LoginResponseDTO> LoginGoogleforCustomer(string email)
        {
            try
            {
                var isExsist = await _context.AccountsModel.Where(a => a.Email == email).FirstOrDefaultAsync();
                if(isExsist == null)
                {
                    return new LoginResponseDTO()
                    {
                        LoginStatus = AuthenticationEnum.Login.Wrong,
                    };
                }
                if(isExsist.IsActive == 0)
                {
                    return new LoginResponseDTO()
                    {
                        LoginStatus = AuthenticationEnum.Login.Banned,
                    };
                }
                LoginResponseDTO newCusGoogle = new LoginResponseDTO()
                {
                    Id = isExsist.Id,
                    Role = isExsist.Role,
                    Email = email,
                    LoginStatus = AuthenticationEnum.Login.Success
                };
                return newCusGoogle;
            }
            catch (Exception ex)
            {
                return new LoginResponseDTO()
                {
                    LoginStatus = AuthenticationEnum.Login.Fail,
                };
            }
        }
    }
}
