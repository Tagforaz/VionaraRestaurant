

using Restaurant.Domain.Entities;

namespace Restaurant.Application.Interfaces.Repositories
{
    public interface IPasswordResetTokenRepository: IRepository<PasswordResetToken>
    {
        Task<PasswordResetToken?> GetValidTokenAsync(Guid userId, string code);
        Task<PasswordResetToken?> GetLatestTokenAsync(Guid userId);
        Task InvalidateUserTokensAsync(Guid userId);
    }
}
