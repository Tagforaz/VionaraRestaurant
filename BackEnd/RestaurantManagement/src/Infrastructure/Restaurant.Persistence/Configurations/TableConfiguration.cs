

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

            builder.HasIndex(t => t.TableNumber)
                .IsUnique();

            builder.HasIndex(t => t.IsAvailable);
        
    }
    }
}
