

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class RestaurantSettingsConfiguration:IEntityTypeConfiguration<RestaurantSettings>
    {
        public void Configure(EntityTypeBuilder<RestaurantSettings> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Name)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(r => r.Address)
                .HasMaxLength(300);

            builder.Property(r => r.Phone)
                .HasMaxLength(20);

            builder.Property(r => r.Email)
                .HasMaxLength(100);

            builder.HasMany(r => r.WorkingHours)
                .WithOne(w => w.RestaurantSettings)
                .HasForeignKey(w => w.RestaurantSettingsId)
                .OnDelete(DeleteBehavior.Cascade);
        }
        public class WorkingHourConfiguration : IEntityTypeConfiguration<WorkingHour>
        {
            public void Configure(EntityTypeBuilder<WorkingHour> builder)
            {
                builder.HasKey(w => w.Id);

                builder.Property(w => w.OpenTime)
                    .HasColumnType("time");

                builder.Property(w => w.CloseTime)
                    .HasColumnType("time");
            }
        }
    }
}
