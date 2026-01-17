

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class CourierConfiguration : IEntityTypeConfiguration<Courier>
    {
        public void Configure(EntityTypeBuilder<Courier> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.AverageRating)
                .HasColumnType("decimal(3,2)");

            //Relational
            builder.HasOne(c=>c.User)
                .WithMany()
                .HasForeignKey(c=>c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasMany(c=>c.Orders)
                .WithOne()
                .HasForeignKey(o=>o.CourierId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.HasMany(c => c.DeliveryTracking)
                .WithOne()
                .HasForeignKey(dt => dt.CourierId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(c => c.UserId).IsUnique();
            builder.HasIndex(c => c.Status);
            builder.HasIndex(c=>c.IsDeleted);

        }
    }
}
