using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Capstone_2_BE.Socket
{
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;
        private static readonly ConcurrentDictionary<string, List<string>> _UserConnection = new();

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier; // <-- đã dùng IUserIdProvider
            if (!string.IsNullOrEmpty(userId))
            {
                var connections = _UserConnection.GetOrAdd(userId, _ => new List<string>());
                lock (connections) connections.Add(Context.ConnectionId);
            }


            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId) && _UserConnection.TryGetValue(userId, out var connections))
            {
                lock (connections)
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0) _UserConnection.TryRemove(userId, out _);
                }
            }

            return base.OnDisconnectedAsync(exception);
        }
        public async Task JoinRoom(string roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        }
    }
}
