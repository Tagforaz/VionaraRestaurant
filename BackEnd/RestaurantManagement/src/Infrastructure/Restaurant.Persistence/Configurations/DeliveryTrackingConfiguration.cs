

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class DeliveryTrackingConfiguration : IEntityTypeConfiguration<DeliveryTracking>
    {
        public void Configure(EntityTypeBuilder<DeliveryTracking> builder)
        {
            builder.HasKey(dt => dt.Id);

            builder.Property(dt => dt.Latitude)
                .HasColumnType("decimal(10,8)");

            builder.Property(dt => dt.Longitude)
                .HasColumnType("decimal(11,8)");

            builder.Property(dt => dt.LocationAddress)
                .HasMaxLength(500);

            builder.Property(dt => dt.Notes)
                .HasMaxLength(500);

            //Relational
            builder.HasOne(dt=>dt.Order)
                .WithMany()
                .HasForeignKey(dt=>dt.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(dt=>dt.Courier)
                .WithMany()
                .HasForeignKey(dt=>dt.CourierId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(dt=>dt.OrderId);
            builder.HasIndex(dt=>dt.CourierId);
            builder.HasIndex(dt => dt.CreatedAt);

        }
    }
}
