
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class FileStorageService:IFileStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _region;
        public FileStorageService(IConfiguration config)
        {
            var accessKey = config["AWS:AccessKey"];
            var secretKey = config["AWS:SecretKey"];
            _bucketName = config["AWS:BucketName"];
            _region = config["AWS:Region"];

            _s3Client = new AmazonS3Client(
                accessKey,
                secretKey,
                RegionEndpoint.GetBySystemName(_region)
            );
        }
        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            var extension = Path.GetExtension(file.FileName);
            var key = $"{folder}/{Guid.NewGuid()}{extension}";

            using var stream = file.OpenReadStream();

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = stream,
                ContentType = file.ContentType
            };

            await _s3Client.PutObjectAsync(request);

            return $"https://{_bucketName}.s3.{_region}.amazonaws.com/{key}";
        }
    }
}
