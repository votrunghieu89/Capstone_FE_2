using Capstone_2_BE.DTOs.Authentication.Google;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Capstone_2_BE.Settings
{
    public class Googles
    {
        private readonly GoogleSetting _googleSetting;
        private readonly ILogger<Googles> _logger;

        public Googles(IOptions<GoogleSetting> options, ILogger<Googles> logger)
        {
            _googleSetting = options.Value;
            _logger = logger;
        }

        public async Task<GoogleLoginResDTO> checkIdToken(string idToken)
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _googleSetting.ClientId }
                    });
            if (payload == null)
            {
                _logger.LogError("Invalid ID token.");
                return null;
            }
            GoogleLoginResDTO googleResponse = new GoogleLoginResDTO
            {
                Email = payload.Email,
                FullName = payload.Name,
                AvartarURL = payload.Picture,
                Sub = payload.Subject
            };
            return googleResponse;
        }
        public async Task<GoogleAccessTokenInfoDTO> CheckAccessToken(string accessToken)
        {
            try
            {
                var client = new HttpClient();

                var response = await client.GetAsync(
                    $"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={accessToken}");

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Invalid access token.");
                    return null;
                }
                var content = await response.Content.ReadAsStringAsync();

                GoogleAccessTokenInfoDTO? tokenInfo = JsonSerializer.Deserialize<GoogleAccessTokenInfoDTO>(content);

                return tokenInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating access token.");
                return null;
            }
        }
    }
}
