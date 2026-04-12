using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Capstone_2_BE.Socket
{
    public class QueryStringUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            var httpContext = connection.GetHttpContext();
            var accountId = httpContext?.Request.Query["AccountId"].ToString();
            if (!string.IsNullOrWhiteSpace(accountId))
            {
                return accountId;
            }

            var userIdFromClaims = connection.User?.FindFirst("AccountId")?.Value
                                   ?? connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                   ?? connection.User?.FindFirst("sub")?.Value
                                   ?? connection.User?.FindFirst("id")?.Value;

            return !string.IsNullOrWhiteSpace(userIdFromClaims)
                ? userIdFromClaims
                : connection.ConnectionId;
        }
    }
}
