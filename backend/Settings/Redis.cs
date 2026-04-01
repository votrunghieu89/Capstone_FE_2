using StackExchange.Redis;
using System.Text.Json;

namespace Capstone_2_BE.Settings
{
    public class Redis
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _db;

        public Redis(IConnectionMultiplexer redis)
        {
            _redis = redis ?? throw new ArgumentNullException(nameof(redis));
            _db = _redis.GetDatabase();
        }

        // --------------------------
        // 🔹 STRING operations
        // --------------------------
        public async Task<bool> SetStringAsync(string key, string value, TimeSpan? expiry = null)
        {
            return await _db.StringSetAsync(key, value, expiry, When.Always);
        }

        public async Task<string?> GetStringAsync(string key)
            => await _db.StringGetAsync(key);

        public async Task<bool> DeleteKeyAsync(string key)
            => await _db.KeyDeleteAsync(key);

        public async Task<bool> KeyExistsAsync(string key)
            => await _db.KeyExistsAsync(key);

        public async Task<long> IncrementAsync(string key, long value = 1)
            => await _db.StringIncrementAsync(key, value);

        public async Task<long> DecrementAsync(string key, long value = 1)
            => await _db.StringDecrementAsync(key, value);

        public async Task DeleteKeysByPatternAsync(string pattern)
        {
            var endpoints = _redis.GetEndPoints();
            var server = _redis.GetServer(endpoints.First());

            foreach (var key in server.Keys(pattern: pattern))
            {
                await _db.KeyDeleteAsync(key);
            }
        }
        public async Task<long> PushListAsync<T>(string key, List<T> list)
        {
            var values = list
                .Select(x => (RedisValue)JsonSerializer.Serialize(x))
                .ToArray();

            return await _db.ListRightPushAsync(key, values);
        }
        public async Task<string?> PopFirstAsync(string key)
        {
            var value = await _db.ListLeftPopAsync(key);

            if (value.IsNull)
                return null;

            return value.IsNull ? null : value.ToString();
        }

    }
}
