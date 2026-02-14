
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Persistence.Implementations.Services
{
    public class FileStorageService:IFileService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _region;

        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private readonly long _maxFileSize = 5 * 1024 * 1024;
        public FileStorageService(IAmazonS3 s3Client, IConfiguration config)
        {
            _s3Client = s3Client;
            _bucketName = config["AWS:BucketName"] ?? throw new ArgumentNullException("AWS:BucketName is missing");
            _region = config["AWS:Region"] ?? throw new ArgumentNullException("AWS:Region is missing");
        }
        public async Task<string> UploadAsync(IFormFile file, string folder = "general")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            if (!IsValidImage(file))
                throw new ArgumentException("Only JPG, JPEG, PNG, WEBP allowed");

            if (file.Length > _maxFileSize)
                throw new ArgumentException("File size exceeds 5MB");

            var extension = Path.GetExtension(file.FileName).ToLower();
            var key = $"{folder}/{Guid.NewGuid()}{extension}";

            using var stream = file.OpenReadStream();

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = stream,
                ContentType = file.ContentType,
            };

            await _s3Client.PutObjectAsync(request);

       
            return $"https://{_bucketName}.s3.{_region}.amazonaws.com/{key}";
        }
        public async Task DeleteAsync(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl))
                return;

            try
            {
                var uri = new Uri(fileUrl);
                var key = uri.AbsolutePath.TrimStart('/');

                var request = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key
                };

                await _s3Client.DeleteObjectAsync(request);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to delete file: {ex.Message}");
            }
        }
        private bool IsValidImage(IFormFile file)
        {
            if (file == null)
                return false;

            var extension = Path.GetExtension(file.FileName).ToLower();
            return _allowedExtensions.Contains(extension);
        }
    }
}
