

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class TableConfiguration:IEntityTypeConfiguration<Table>
    {
        public void Configure(EntityTypeBuilder<Table> builder)
        {
            builder.HasKey(t => t.Id);

            builder.Property(t => t.TableNumber)
               .IsRequired();

            builder.Property(t => t.Capacity)
                .IsRequired();

            builder.Property(t => t.PositionX)
                .HasColumnType("decimal(5,2)")
                .IsRequired()
                .HasDefaultValue(50.0m);

            builder.Property(t => t.PositionY)
                .HasColumnType("decimal(5,2)")
                .IsRequired()
                .HasDefaultValue(50.0m);

            builder.Property(t =>t.Rotation)
                .HasDefaultValue(0);

            builder.HasIndex(t => t.TableNumber)
                .IsUnique()
                .HasDatabaseName("IX_Tables_TableNumber_Unique");

            builder.HasIndex(t => t.IsAvailable);

            builder.HasIndex(t => new { t.PositionX, t.PositionY });
    }
    }
}
