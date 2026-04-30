using StackExchange.Redis;
using System.Text.Json;

namespace Capstone_2_BE.Settings
{
    public class Redis
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase? _db;

        public Redis(IConnectionMultiplexer redis)
        {
            _redis = redis ?? throw new ArgumentNullException(nameof(redis));
            _db = _redis.IsConnected ? _redis.GetDatabase() : null;
        }

        private bool IsAvailable => _db is not null && _redis.IsConnected;

        // --------------------------
        // 🔹 STRING operations
        // --------------------------
        public async Task<bool> SetStringAsync(string key, string value, TimeSpan? expiry = null)
        {
            if (!IsAvailable)
                return false;

            try
            {
                return await _db!.StringSetAsync(key, value, expiry, When.Always);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<string?> GetStringAsync(string key)
        {
            if (!IsAvailable)
                return null;

            try
            {
                return await _db!.StringGetAsync(key);
            }
            catch (RedisConnectionException)
            {
                return null;
            }
            catch (RedisTimeoutException)
            {
                return null;
            }
        }

        public async Task<bool> DeleteKeyAsync(string key)
        {
            if (!IsAvailable)
                return false;

            try
            {
                return await _db!.KeyDeleteAsync(key);
            }
            catch (RedisConnectionException)
            {
                return false;
            }
            catch (RedisTimeoutException)
            {
                return false;
            }
        }

        public async Task<bool> KeyExistsAsync(string key)
        {
            if (!IsAvailable)
                return false;

            try
            {
                return await _db!.KeyExistsAsync(key);
            }
            catch (RedisConnectionException)
            {
                return false;
            }
            catch (RedisTimeoutException)
            {
                return false;
            }
        }

        public async Task<long> IncrementAsync(string key, long value = 1)
        {
            if (!IsAvailable)
                return 0;

            try
            {
                return await _db!.StringIncrementAsync(key, value);
            }
            catch (RedisConnectionException)
            {
                return 0;
            }
            catch (RedisTimeoutException)
            {
                return 0;
            }
        }

        public async Task<long> DecrementAsync(string key, long value = 1)
        {
            if (!IsAvailable)
                return 0;

            try
            {
                return await _db!.StringDecrementAsync(key, value);
            }
            catch (RedisConnectionException)
            {
                return 0;
            }
            catch (RedisTimeoutException)
            {
                return 0;
            }
        }

        public async Task DeleteKeysByPatternAsync(string pattern)
        {
            if (!IsAvailable)
                return;

            try
            {
                var endpoints = _redis.GetEndPoints();
                if (endpoints.Length == 0)
                    return;

                var server = _redis.GetServer(endpoints.First());

                foreach (var key in server.Keys(pattern: pattern))
                {
                    await _db!.KeyDeleteAsync(key);
                }
            }
            catch (RedisConnectionException)
            {
            }
            catch (RedisTimeoutException)
            {
            }
        }

        public async Task<long> PushListAsync<T>(string key, List<T> list)
        {
            if (!IsAvailable)
                return 0;

            try
            {
                var values = list
                    .Select(x => (RedisValue)JsonSerializer.Serialize(x))
                    .ToArray();

                return await _db!.ListRightPushAsync(key, values);
            }
            catch (RedisConnectionException)
            {
                return 0;
            }
            catch (RedisTimeoutException)
            {
                return 0;
            }
        }

        public async Task<string?> PopFirstAsync(string key)
        {
            if (!IsAvailable)
                return null;

            try
            {
                var value = await _db!.ListLeftPopAsync(key);

                if (value.IsNull)
                    return null;

                return value.ToString();
            }
            catch (RedisConnectionException)
            {
                return null;
            }
            catch (RedisTimeoutException)
            {
                return null;
            }
        }

    }
}
