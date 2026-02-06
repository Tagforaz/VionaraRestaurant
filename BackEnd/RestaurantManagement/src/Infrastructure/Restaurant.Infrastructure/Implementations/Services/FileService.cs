

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Infrastructure.Implementations.Services
{
    public class FileService:IFileService
    {
        private readonly IWebHostEnvironment _env;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private readonly long _maxFileSize = 5 * 1024 * 1024;

        public FileService(IWebHostEnvironment env)
        {
            _env = env;
        }
        public async Task<string> UploadAsync(IFormFile file,string folder = "general")
        {
            if (file == null|| file.Length==0)
               throw new ArgumentException("File is empty");
            if (!IsValidImage(file))
                throw new ArgumentException("Wrong file format. Only JPG,JPEG,PNG,WEBP allowed ");
            if (file.Length > _maxFileSize)
                throw new ArgumentException($"File size more than {_maxFileSize}MB limit");

            var uploadsFolder = Path.Combine(_env.WebRootPath,"uploads",folder);
            Directory.CreateDirectory(uploadsFolder);

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder,fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            return $"/uploads/{folder}/{fileName}";
            
        }

        public Task DeleteAsync(string fileUrl)
        {
            if(string.IsNullOrEmpty(fileUrl))
                return Task.CompletedTask;

            var filePath = Path.Combine(_env.WebRootPath,fileUrl.TrimStart('/'));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public bool IsValidImage(IFormFile file)
        {
            if(file== null)
                return false;

            var extension = Path.GetExtension(file.FileName).ToLower();
            return _allowedExtensions.Contains(extension);
        }
    }
}
