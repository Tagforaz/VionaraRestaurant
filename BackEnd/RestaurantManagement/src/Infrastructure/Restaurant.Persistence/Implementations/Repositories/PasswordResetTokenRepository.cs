

using Microsoft.EntityFrameworkCore;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    internal class PasswordResetTokenRepository : Repository<PasswordResetToken>, IPasswordResetTokenRepository
    {
        public PasswordResetTokenRepository(AppDbContext context) : base(context)
        {

        }

        public async Task<PasswordResetToken?> GetValidTokenAsync(Guid userId, string code)
        {
            return await GetAll(
                filter: t => t.UserId == userId &&
                            t.Code == code &&
                            !t.IsUsed &&
                            t.ExpiresAt > DateTime.UtcNow,
                asNoTracking: false
            ).FirstOrDefaultAsync();
        }

        public async Task<PasswordResetToken?> GetLatestTokenAsync(Guid userId)
        {
            return await GetAll(
                filter: t => t.UserId == userId,
                orderBy: t => t.CreatedAt,
                isDescending: true,
                asNoTracking: false
            ).FirstOrDefaultAsync();
        }

        public async Task InvalidateUserTokensAsync(Guid userId)
        {
            var tokens = await GetAll(
                filter: t => t.UserId == userId && !t.IsUsed,
                asNoTracking: false
            ).ToListAsync();

            foreach (var token in tokens)
            {
                token.IsUsed = true;
                token.UsedAt = DateTime.UtcNow;
                Update(token);
            }

            await SaveChangesAsync();
        }
    }
}
