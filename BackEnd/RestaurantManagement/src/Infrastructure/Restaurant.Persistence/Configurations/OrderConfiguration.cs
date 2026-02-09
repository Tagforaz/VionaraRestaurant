

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.HasKey(o => o.Id);

            builder.Property(o => o.OrderNumber)
                .IsRequired()
                .HasMaxLength(50);
            builder.Property(o => o.OrderNotes)
                .HasMaxLength(800);

          
            builder.Property(o => o.Subtotal)
                  .HasColumnType("decimal(18,2)")
                  .IsRequired();

            builder.Property(o => o.Total)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.OwnsOne(o => o.DeliveryAddress, address =>
            {
                address.Property(a => a.Street)
                .HasColumnName("DeliveryAddress_Street")
                .HasMaxLength(200);

                address.Property(a => a.City)
                .HasColumnName("DeliveryAddress_City")
                .HasMaxLength(100);

                address.Property(a => a.Country)
                .HasColumnName("DeliveryAddress_Country")
                .HasMaxLength(100);
            });

            builder.Property(o => o.DiscountAmount)
                .HasColumnType("decimal(18,2)");

            //Relational
            builder.HasOne(o=>o.User)
                .WithMany(u=>u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(o=>o.Courier)
                .WithMany()
                .HasForeignKey(o=>o.CourierId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(o=>o.Table)
                .WithMany(t => t.Orders)
                .HasForeignKey(o =>o.TableId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(o => o.Coupon)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CouponId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.HasMany(o=>o.Items)
                .WithOne(oi=>oi.Order)
                .HasForeignKey(oi=>oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(o => o.OrderNumber).IsUnique();
            builder.HasIndex(o => o.UserId);
            builder.HasIndex(o => o.TableId);
            builder.HasIndex(o=>o.Status);
            builder.HasIndex(o => o.CreatedAt);
        }
    }
}
