using Capstone_2_BE.DALs;
using Capstone_2_BE.DTOs;
using Capstone_2_BE.DTOs.Authentication;
using Capstone_2_BE.DTOs.Authentication.Google;
using Capstone_2_BE.Enums;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Repositories.Technician;
using Capstone_2_BE.Securities;
using Capstone_2_BE.Settings;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StackExchange.Redis;
using System.Security.Cryptography;

namespace Capstone_2_BE.Services
{
    public class AuthenticationService
    {
        private readonly Token _token;
        private readonly IAuthenticationRepo _authenticationDAL;
        private readonly Redis _redis;
        private readonly Email _email;
        private readonly Googles _google;

        public AuthenticationService(Token token, IAuthenticationRepo authenticationDAL, Redis redis, Email email, Googles google)
        {
            _token = token;
            _authenticationDAL = authenticationDAL;
            _redis = redis;
            _email = email;
            _google = google;
        }

        public async Task<Result<string>> RegisterAccountAdmin(DTOs.LoginDTO loginDTO)
        {
            try
            {
                var ok = await _authenticationDAL.RegisterAccountAdmin(loginDTO.Email, loginDTO.Password);
                if (ok) return Result<string>.Success("Tạo tài khoản admin thành công", 201);
                return Result<string>.Failure("Tạo tài khoản admin thất bại", 400);
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Lỗi khi tạo tài khoản admin", 500);
            }
        }

        public static string GenerateOTP(int length = 6)
        {
            if (length <= 0) throw new ArgumentException("Length must be positive", nameof(length));

            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            int number = BitConverter.ToInt32(bytes, 0) & 0x7FFFFFFF;
            int otp = number % (int)Math.Pow(10, length);
            return otp.ToString($"D{length}");
        }

        public async Task<bool> SendOTP(string Email)
        {
            try
            {
                string RedisKey_OTP = $"OTP_{Email}";
                var otp = GenerateOTP();
                var otpHash = Hash.HashPassword(otp);
                await _redis.SetStringAsync(RedisKey_OTP, otpHash, TimeSpan.FromMinutes(5));

                string subject = "🎓 Xác thực tài khoản giáo viên - Hệ thống FixFast";

                string body = $@"
                                    <html>
                                    <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
                                        <h2 style='color: #4a90e2;'>Xin chào {Email},</h2>
                                        <p>Cảm ơn bạn đã đăng ký tài khoản  tại <strong>EduQuiz</strong>.</p>
                                        <p>Để hoàn tất quá trình đăng ký, vui lòng nhập mã xác thực (OTP) bên dưới:</p>

                                        <div style='background-color: #f3f4f6; padding: 12px 20px; display: inline-block; border-radius: 8px; margin: 10px 0;'>
                                            <h2 style='color: #111827; letter-spacing: 4px;'>{otp}</h2>
                                        </div>

                                        <p>Mã OTP này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                                        <p style='margin-top: 20px;'>Trân trọng,<br><strong>Đội ngũ EduQuiz</strong></p>
                                    </body>
                                    </html>";
                await _email.SendEmailAsync(Email, subject, body);
                return true;
            }
            catch (Exception ex) {
                return false;
            }

        }

        public async Task<Result<LoginResultDTO>> Login(LoginDTO loginDTO)
        {
            var loginResult = await _authenticationDAL.Login(loginDTO.Email, loginDTO.Password);
            switch (loginResult.LoginStatus)
            {
                case AuthenticationEnum.Login.Success:
                    var accessToken = _token.generateAccessToken(loginResult.Id, loginResult.Role, loginResult.Email);
                    var refressToken = _token.generateRefreshToken();
                    bool setRefresh = await _redis.SetStringAsync($"RefressToken:{loginResult.Id}", refressToken, TimeSpan.FromDays(7));
                    return Result<LoginResultDTO>.Success(new LoginResultDTO
                    {
                        Id = loginResult.Id,
                        Email = loginResult.Email,
                        Role = loginResult.Role,
                        accessToken = accessToken,
                        refressToken = refressToken
                    });
                case AuthenticationEnum.Login.Wrong:
                    return Result<LoginResultDTO>.Failure("Sai tên đăng nhập hoặc mật khẩu", 401);
                case AuthenticationEnum.Login.Banned:
                    return Result<LoginResultDTO>.Failure("Tài khoản đã bị khoá", 404);
                case AuthenticationEnum.Login.Fail:
                default:
                    return Result<LoginResultDTO>.Failure("Đăng nhập thất bại", 500);

            }
        }

        public async Task<bool> verifyOTP(string Email, string otp)
        {
            try
            {
                string? OTP = await _redis.GetStringAsync("OTP_" + Email);
                if (OTP == null)
                {

                    return false;
                }
                bool checkOTP = Hash.VerifyPassword(otp, OTP);

                if (!checkOTP)
                {
                    return false;
                }

                bool deleted = await _redis.DeleteKeyAsync($"OTP_{Email}");
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> saveRegisterInformation(RegisterCustomerDTO authRegisterDTO)
        {
            try
            {
                string key = $"Register:{authRegisterDTO.Email}";
                bool isSave = await _redis.SetStringAsync(key, JsonConvert.SerializeObject(authRegisterDTO), TimeSpan.FromMinutes(5));
                if (isSave) { 
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<string> getNewAccessToken(GetNewAccessTokenDTO getAccessToken)
        {
            string? refreshTokenInDb = await _redis.GetStringAsync($"RefressToken_{getAccessToken.Id}");
            if (refreshTokenInDb == null || refreshTokenInDb != getAccessToken.RefressToken)
            {
                return null;
            }
            var newAccessToken = _token.generateAccessToken(getAccessToken.Id, getAccessToken.Role, getAccessToken.Email);
            return newAccessToken;
        }

        public async Task<Result<string>> Logout(Guid accountId) {
            try
            {
                bool deleted = await _redis.DeleteKeyAsync($"RefressToken_{accountId}");
                bool deleteOnline = await _redis.DeleteKeyAsync($"Online_{accountId}");

                if (deleted)
                {
                    return Result<string>.Success("Đăng xuất thành công", 200);
                }
                else
                {
                    return Result<string>.Failure("Không tìm thấy phiên đăng nhập", 404);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Đăng xuất thất bại", 500);
            }
        }
        // này là để lưu vào Redis
        public async Task<Result<string>> RegisterCustomer(string Email )
        {
            try
            {
                string key = $"Register:{Email}";
                var authRegisterStuidentDTOJson = await _redis.GetStringAsync(key);
                var authRegisterDTO = JsonConvert.DeserializeObject<RegisterCustomerDTO>(authRegisterStuidentDTOJson ?? string.Empty);
                var result = await _authenticationDAL.RegisterCustomer(authRegisterDTO);
                switch (result) {
                    case AuthenticationEnum.Register.Success:
                        return Result<string>.Success("Đăng kí thành công", 200);
                    case AuthenticationEnum.Register.Fail:
                        return Result<string>.Failure("Đăng kí thất bại", 400);
                    default:
                        return Result<string>.Failure("Đăng kí thất bại", 500);
                }
            }
            catch (Exception ex) {
                return Result<string>.Failure("Đăng kí thất bại", 500);
            }
        }

        public async Task<Result<string>> RegisterTechnician(RegisterFixerDTO authRegisterDTO)
        {
            try
            {
                var result = await _authenticationDAL.RegisterTechnician(authRegisterDTO);
                switch (result)
                {
                    case AuthenticationEnum.Register.Success:
                        return Result<string>.Success("Đăng kí thành công", 200);
                    case AuthenticationEnum.Register.Fail:
                        return Result<string>.Failure("Đăng kí thất bại", 400);
                    default:
                        return Result<string>.Failure("Đăng kí thất bại", 500);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Đăng kí thất bại", 500);
            }
        }

        public async Task<Result<Guid>> IsEmailExist(string email)
        {
            try
            {
                var accountId = await _authenticationDAL.isEmailExist(email);
                if (accountId.HasValue)
                {
                    return Result<Guid>.Success(accountId.Value, 200);
                }
                else
                {
                    return Result<Guid>.Failure("Email không tồn tại", 404);
                }
            }
            catch (Exception ex)
            {
                return Result<Guid>.Failure("Lỗi khi kiểm tra email", 500);
            }
        }

        public async Task<Result<string>> ChangePassword(ChangePasswordDTO changePasswordDTO)
        {
            try
            {
                if (changePasswordDTO.NewPassword != changePasswordDTO.ConfirmPassword)
                {
                    return Result<string>.Failure("Mật khẩu xác nhận không khớp", 400);
                }

                var result = await _authenticationDAL.ChangePassword(changePasswordDTO);
                if (result)
                {
                    return Result<string>.Success("Đổi mật khẩu thành công", 200);
                }
                else
                {
                    return Result<string>.Failure("Mật khẩu cũ không đúng hoặc tài khoản không tồn tại", 400);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Đổi mật khẩu thất bại", 500);
            }
        }

        public async Task<Result<string>> ForgetPassword(string email, string newPassword)
        {
            try
            {
                var accountId = await _authenticationDAL.isEmailExist(email);
                if (!accountId.HasValue)
                {
                    return Result<string>.Failure("Email không tồn tại", 404);
                }

                var hashedPassword = Hash.HashPassword(newPassword);
                var result = await _authenticationDAL.ForgetPassword(email, hashedPassword);

                if (result)
                {
                    // Xoá refresh token cũ để buộc đăng nhập lại
                    await _redis.DeleteKeyAsync($"RefressToken_{accountId.Value}");
                    return Result<string>.Success("Đặt lại mật khẩu thành công", 200);
                }
                else
                {
                    return Result<string>.Failure("Đặt lại mật khẩu thất bại", 400);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Đặt lại mật khẩu thất bại", 500);
            }
        }

        public async Task<Result<string>> UpdateOnlineStatus(UpdateOnlineStatusDTO updateOnlineStatusDTO)
        {
            try
            {
                // Validate isOnline value (0 or 1)
                if (updateOnlineStatusDTO.IsOnline != 0 && updateOnlineStatusDTO.IsOnline != 1)
                {
                    return Result<string>.Failure("Trạng thái không hợp lệ. Chỉ chấp nhận 0 (Do Not Disturb) hoặc 1 (Online)", 400);
                }

                var result = await _authenticationDAL.UpdateOnlineStatus(updateOnlineStatusDTO.AccountId, updateOnlineStatusDTO.IsOnline);

                if (result)
                {
                    string statusMessage = updateOnlineStatusDTO.IsOnline == 1
                        ? "Đã chuyển sang trạng thái Online"
                        : "Đã chuyển sang chế độ Không làm phiền";

                    return Result<string>.Success(statusMessage, 200);
                }
                else
                {
                    return Result<string>.Failure("Không tìm thấy tài khoản hoặc cập nhật thất bại", 404);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Lỗi khi cập nhật trạng thái online", 500);
            }
        }

        public async Task<Result<LoginResultDTO>> LoginViaGoogleCustomer(GoogleLoginDTO googleloginDTO)
        {
            try
            {
                if (googleloginDTO == null || string.IsNullOrEmpty(googleloginDTO.IdToken))
                {
                    return Result<LoginResultDTO>.Failure("Dữ liệu đăng nhập không hợp lệ", 400);
                }
                var TokenIdInfor = await _google.checkIdToken(googleloginDTO.IdToken); // trả về Email, FullName, AvatarURL
                if (TokenIdInfor == null || string.IsNullOrEmpty(TokenIdInfor.Email))
                {
                    return Result<LoginResultDTO>.Failure("Token Id không hợp lệ", 401);
                }
                var checkAccessToken = await _google.CheckAccessToken(googleloginDTO.AccessToken);
                if (checkAccessToken == null)
                {
                        return Result<LoginResultDTO>.Failure("Access token không hợp lệ", 401);
                }
                if (TokenIdInfor.Sub != checkAccessToken.sub)
                {
                    return Result<LoginResultDTO>.Failure("Token không khớp user", 401);
                }
                var checkEmail = await _authenticationDAL.isEmailExist(TokenIdInfor.Email);
                if (checkEmail == null)
                {
                    var newCustomer = new RegisterCustomerDTO
                    {
                        Email = TokenIdInfor.Email,
                        FullName = TokenIdInfor.FullName,
                        Password = Hash.HashPassword(Guid.NewGuid().ToString()),
                        PhoneNumber = null
                    };
                    var registerResult = await _authenticationDAL.RegisterCustomer(newCustomer);
                }
                var loginResult = await _authenticationDAL.LoginGoogleforCustomer(TokenIdInfor.Email);
                switch (loginResult.LoginStatus)
                {
                    case AuthenticationEnum.Login.Success:
                        var accessToken = _token.generateAccessToken(loginResult.Id, loginResult.Role, loginResult.Email);
                        var refressToken = _token.generateRefreshToken();
                        bool setRefresh = await _redis.SetStringAsync($"RefressToken:{loginResult.Id}", refressToken, TimeSpan.FromDays(7));
                        return Result<LoginResultDTO>.Success(new LoginResultDTO
                        {
                            Id = loginResult.Id,
                            Email = loginResult.Email,
                            Role = loginResult.Role,
                            accessToken = accessToken,
                            refressToken = refressToken
                        }, 200);
                    case AuthenticationEnum.Login.Banned:
                        return Result<LoginResultDTO>.Failure("Tài khoản đã bị khoá", 404);
                    case AuthenticationEnum.Login.Fail:
                    default:
                        return Result<LoginResultDTO>.Failure("Đăng nhập thất bại", 500);
                }
            }
            catch (Exception ex)
            {
                return Result<LoginResultDTO>.Failure("Đăng nhập thất bại", 500);
            }
        } 
    }
}
