using Capstone_2_BE.DTOs;
using Capstone_2_BE.DTOs.Authentication;
using Capstone_2_BE.DTOs.Authentication.Google;
using Capstone_2_BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthenticationController : Controller
    {
        public readonly AuthenticationService _authenticationService;
        public readonly ILogger<AuthenticationController> _logger;
        
        public AuthenticationController(AuthenticationService authenticationService, ILogger<AuthenticationController> logger)
        {
            _authenticationService = authenticationService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDTO)
        {
            var result = await _authenticationService.Login(loginDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutDTO logoutDTO)
        {
            var result = await _authenticationService.Logout(logoutDTO.AccountId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        // Save registration info temporarily (Redis)
        [HttpPost("register/save")]
        public async Task<IActionResult> SaveRegisterInformation([FromBody] RegisterCustomerDTO registerDTO)
        {
            var saved = await _authenticationService.saveRegisterInformation(registerDTO);
            if (saved)
            {
                return Ok(new { message = "Lưu thông tin đăng ký tạm thời thành công" });
            }
            return BadRequest(new { message = "Lưu thông tin đăng ký thất bại" });
        }

        // Finalize registration by email (reads from Redis)
        [HttpPost("register/customer/confirm")]
        public async Task<IActionResult> RegisterCustomerConfirm([FromBody] CheckEmailDTO emailDTO)
        {
            var result = await _authenticationService.RegisterCustomer(emailDTO.Email);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        //[HttpPost("register/customer")]
        //public async Task<IActionResult> RegisterCustomer([FromBody] RegisterCustomerDTO registerDTO)
        //{
        //    var result = await _authenticationService.RegisterCustomer(registerDTO);
        //    if (!result.IsSuccess)
        //    {
        //        return StatusCode(result.StatusCode, new { message = result.Error });
        //    }
        //    return StatusCode(result.StatusCode, new { message = result.Data });
        //}

        [HttpPost("register/technician")]
        public async Task<IActionResult> RegisterTechnician([FromBody] RegisterFixerDTO registerDTO)
        {
            var result = await _authenticationService.RegisterTechnician(registerDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
        [HttpPost("register/admin")]
        public async Task<IActionResult> RegisterAdmin([FromBody] LoginDTO loginDTO)
        {
            var result = await _authenticationService.RegisterAccountAdmin(loginDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOTP([FromBody] SendOTPDTO sendOTPDTO)
        {
            var result = await _authenticationService.SendOTP(sendOTPDTO.Email);
            if (result)
            {
                return Ok(new { message = "Gửi OTP thành công" });
            }
            return BadRequest(new { message = "Gửi OTP thất bại" });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOTP([FromBody] VerifyOTPDTO verifyOTPDTO)
        {
            var result = await _authenticationService.verifyOTP(verifyOTPDTO.Email, verifyOTPDTO.OTP);
            if (result)
            {
                return Ok(new { message = "Xác thực OTP thành công" });
            }
            return BadRequest(new { message = "OTP không hợp lệ hoặc đã hết hạn" });
        }

        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail([FromBody] CheckEmailDTO checkEmailDTO)
        {
            var result = await _authenticationService.IsEmailExist(checkEmailDTO.Email);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = "Email đã tồn tại", accountId = result.Data });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO changePasswordDTO)
        {
            var result = await _authenticationService.ChangePassword(changePasswordDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("forget-password")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDTO forgetPasswordDTO)
        {
            var result = await _authenticationService.ForgetPassword(forgetPasswordDTO.Email, forgetPasswordDTO.NewPassword);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> GetNewAccessToken([FromBody] GetNewAccessTokenDTO getAccessTokenDTO)
        {
            var newAccessToken = await _authenticationService.getNewAccessToken(getAccessTokenDTO);
            if (newAccessToken == null)
            {
                return Unauthorized(new { message = "Refresh token không hợp lệ" });
            }
            return Ok(new { accessToken = newAccessToken });
        }

        [HttpPut("update-online-status")]
        public async Task<IActionResult> UpdateOnlineStatus([FromBody] UpdateOnlineStatusDTO updateOnlineStatusDTO)
        {
            var result = await _authenticationService.UpdateOnlineStatus(updateOnlineStatusDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        // New endpoint for Google login (customer)
        [HttpPost("login/google/customer")]
        public async Task<IActionResult> LoginViaGoogleCustomer([FromBody] GoogleLoginDTO googleLoginDTO)
        {
            var result = await _authenticationService.LoginViaGoogleCustomer(googleLoginDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }
    }
}