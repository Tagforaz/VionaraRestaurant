
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class FileStorageService:IFileService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _region;
        public FileStorageService(IConfiguration config)
        {
            var accessKey = config["AWS:AccessKey"];
            var secretKey = config["AWS:SecretKey"];
            _bucketName = config["AWS:BucketName"] ?? throw new ArgumentNullException("BucketName is missing"); 
            _region = config["AWS:Region"] ?? throw new ArgumentNullException("Region is missing");

            _s3Client = new AmazonS3Client(
                accessKey,
                secretKey,
                RegionEndpoint.GetBySystemName(_region)
            );
        }
        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var extension = Path.GetExtension(file.FileName);
            var key = $"{folder}/{Guid.NewGuid()}{extension}";

            using var stream = file.OpenReadStream();

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = stream,
                ContentType = file.ContentType,
                CannedACL = S3CannedACL.PublicRead
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
            catch (Exception)
            {
                
            }
        }
    }
}
