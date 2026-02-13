

namespace Restaurant.Domain.Entities
{
    public class PasswordResetToken : BaseAuditableEntity
    {
        public Guid UserId { get; set; }
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
        public DateTime? UsedAt { get; set; }

        public User User { get; set; } = null!;

        public bool IsValid()
        {
            return !IsUsed && DateTime.UtcNow < ExpiresAt;
        }
    }
}
