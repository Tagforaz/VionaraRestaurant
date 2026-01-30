

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IAuthenticationService
    {
        Task RegisterAsync(RegisterDto userDto);
    }
}
