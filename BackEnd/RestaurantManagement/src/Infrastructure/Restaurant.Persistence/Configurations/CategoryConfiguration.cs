

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("Categories");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(c => c.Name)
                .IsUnique()
                .HasFilter("[IsDeleted] = 0")
                .HasDatabaseName("IX_Categories_Name_Unique");

            builder.Property(c => c.ImageUrl)
                .HasMaxLength(500);

            builder.HasIndex(c => c.SortOrder)
                .IsUnique()
                .HasFilter("[IsDeleted] = 0")
                .HasDatabaseName("Categories_SortOrder_Unique");
            //Relational
            builder.HasMany(c => c.Products)
                .WithOne(p => p.Category)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

           
            builder.HasIndex(c => c.IsDeleted);
           
        }
    }
}
