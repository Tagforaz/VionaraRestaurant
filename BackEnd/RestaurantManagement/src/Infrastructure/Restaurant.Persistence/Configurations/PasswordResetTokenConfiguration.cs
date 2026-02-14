

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
    {
        public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
        {
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Code)
                .IsRequired()
                .HasMaxLength(10);

            builder.Property(t => t.ExpiresAt)
                .IsRequired();

            builder.Property(t => t.IsUsed)
                .IsRequired()
                .HasDefaultValue(false);

            builder.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(t => new { t.UserId, t.Code });
            builder.HasIndex(t => t.ExpiresAt);
            builder.HasIndex(t => t.IsUsed);
        }
    }
}
