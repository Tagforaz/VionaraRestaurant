
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Description)
                .HasMaxLength(1000);

            builder.Property(p => p.ImageUrl)
                .HasMaxLength(500);

            builder.Property(p => p.Price)
               .HasColumnType("decimal(18,2)")
               .IsRequired();

            builder.Property(p => p.AverageRating)
                .HasColumnType("decimal(3,2)");

            //Relational
            builder.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.OrderItems)
                .WithOne(oi => oi.Product)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.Reviews)
                .WithOne(r => r.Product)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(p => p.CategoryId);
            builder.HasIndex(p => p.IsDeleted);
            builder.HasIndex(p => p.IsAvailable);
            builder.HasIndex(p => p.AverageRating);


        }
    }
}
