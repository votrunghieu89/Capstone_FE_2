using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

namespace Capstone_2_BE.Settings
{
    public class AWS
    {
        private readonly string _bucketName;
        private readonly IAmazonS3 _s3Client;

        public AWS(IConfiguration configuration)
        {
            _bucketName = configuration["AWS:BucketName"];
            var accessKey = configuration["AWS:AccessKey"];
            var secretKey = configuration["AWS:SecretKey"];
            var region = configuration["AWS:Region"];

            if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey) && !string.IsNullOrEmpty(region))
            {
                _s3Client = new AmazonS3Client(accessKey, secretKey, RegionEndpoint.GetBySystemName(region));
            }
            else
            {
                Console.WriteLine("⚠️ AWS S3 is not configured. Uploads will be skipped.");
            }
        }

        public async Task<bool> DeleteImage(string key)
        {
            if (_s3Client == null) return true; // Pretend success for unconfigured AWS
            var deleteObject = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            };
            try
            {
                var response = await _s3Client.DeleteObjectAsync(deleteObject);
                return true; // xoá thành công
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error deleting file: " + ex.Message);
                return false;
            }
        }

        public async Task<string> UploadProfile(IFormFile file)
        {
            if (_s3Client == null) return "profile/Default.jpg"; // Mock path
            try
            {
                string key = $"profile/{Guid.NewGuid()}_{file.FileName}";

                using var stream = file.OpenReadStream();

                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
                return key;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Upload S3 FAILED: {ex.Message}");
                return null;
            }
        }

        public async Task<string> UploadVideoOrder(IFormFile file)
        {
            if (_s3Client == null) return $"Video/Mock_{file.FileName}";
            try
            {
                string key = $"Video/{Guid.NewGuid()}_{file.FileName}";

                using var stream = file.OpenReadStream();

                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
                return key;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Upload S3 FAILED: {ex.Message}");
                return null;
            }
        }
        public async Task<string> UploadImageOrder(IFormFile file)
        {
            if (_s3Client == null) return $"Image/Mock_{file.FileName}";
            try
            {
                string key = $"Image/{Guid.NewGuid()}_{file.FileName}";

                using var stream = file.OpenReadStream();

                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
                return key;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Upload S3 FAILED: {ex.Message}");
                return null;
            }
        }
        public async Task<string> ReadImage(string key)
        {
            return $"https://{_bucketName}.s3.ap-southeast-2.amazonaws.com/{key}";
        }
    }
}
