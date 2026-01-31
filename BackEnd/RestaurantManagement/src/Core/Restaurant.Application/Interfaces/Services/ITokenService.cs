

using Restaurant.Application.DTOs.Tokens;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ITokenService
    {
        TokenResponseDto CreateAccessToken(User user, int minutes);
    }
}
