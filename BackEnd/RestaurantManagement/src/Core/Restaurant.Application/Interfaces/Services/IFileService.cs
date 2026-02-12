

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IFileService
    {
        Task<string> UploadAsync(IFormFile file, string folder = "general");
        Task DeleteAsync(string fileUrl);
    
    }
}
