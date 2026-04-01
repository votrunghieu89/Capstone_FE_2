using Microsoft.AspNetCore.SignalR;

namespace Capstone_2_BE.Socket
{
    public class QueryStringUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            // Lấy AccountId từ query string
            var accountId = connection.GetHttpContext()?.Request.Query["AccountId"].ToString();
            return string.IsNullOrEmpty(accountId) ? connection.ConnectionId : accountId;
        }
    }
}
