

using Microsoft.EntityFrameworkCore;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    internal class PasswordResetTokenRepository : Repository<PasswordResetToken>,IPasswordResetTokenRepository
    {
        public PasswordResetTokenRepository(AppDbContext context) : base(context) 
        {
            
        }

        public async Task<PasswordResetToken?> GetValidTokenAsync(Guid userId,string code)
        {
            return await _context.Set<PasswordResetToken>()
                .FirstOrDefaultAsync(t =>
                t.UserId == userId &&
                t.Code == code &&
                !t.IsUsed &&
                t.ExpiresAt > DateTime.UtcNow);
        }

        public async Task<PasswordResetToken?> GetLatestTokenAsync(Guid userId)
        {
            return await _context.Set<PasswordResetToken>()
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task InvalidateUserTokensAsync(Guid userId)
        {
            var tokens = await _context.Set<PasswordResetToken>()
                .Where(t => t.UserId == userId && !t.IsUsed)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.IsUsed = true;
                token.UsedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
