
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
    {
        public void Configure(EntityTypeBuilder<Coupon> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.DiscountValue)
                .HasColumnType("decimal(18,2)");
            builder.Property(c => c.MinimumOrderAmount)
                .HasColumnType("decimal(18,2)");
            builder.Property(c => c.MaximumDiscountAmount)
                .HasColumnType("decimal(18,2)");

            //Relational
            builder.HasMany(c => c.Orders)
                .WithOne(o => o.Coupon)
                .HasForeignKey(o => o.CouponId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(c => c.Code).IsUnique();
            builder.HasIndex(c => c.IsActive);
            builder.HasIndex(c=>c.IsDeleted);
        }
    }
}
