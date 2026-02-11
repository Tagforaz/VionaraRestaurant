

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(IFormFile file, string folder);
    }
}
