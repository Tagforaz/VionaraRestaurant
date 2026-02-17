

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class LocationHistoryConfiguration : IEntityTypeConfiguration<LocationHistory>
    {
        public void Configure(EntityTypeBuilder<LocationHistory> builder)
        {
            builder.HasKey(lh => lh.Id);

            builder.Property(lh => lh.Latitude)
                .HasColumnType("decimal(10,8)")
                .IsRequired();

            builder.Property(lh => lh.Longitude)
                .HasColumnType("decimal(11,8)")
                .IsRequired();

            builder.Property(lh => lh.Timestamp)
                .IsRequired();



            // Relational
            builder.HasOne(lh => lh.Courier)
                .WithMany()
                .HasForeignKey(lh => lh.CourierId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(lh => lh.Order)
               .WithMany()
               .HasForeignKey(lh => lh.OrderId)
               .OnDelete(DeleteBehavior.SetNull)
               .IsRequired(false);

            builder.HasIndex(lh => lh.CourierId);
            builder.HasIndex(lh => lh.OrderId);
            builder.HasIndex(lh => lh.Timestamp);

            builder.HasIndex(lh => new { lh.CourierId, lh.Timestamp });
        }
    }
}
