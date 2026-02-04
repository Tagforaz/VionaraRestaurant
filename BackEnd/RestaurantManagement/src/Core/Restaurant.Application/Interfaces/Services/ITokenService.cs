

using Restaurant.Application.DTOs.Tokens;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ITokenService
    {
        TokenResponseDto CreateAccessToken(User user, IEnumerable<string> roles, int minutes);
    }
}
