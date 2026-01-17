

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.HasKey(r=>r.Id);

            builder.Property(r => r.Comment)
                .IsRequired()
                .HasMaxLength(1000);
            builder.Property(r => r.Rating)
                .IsRequired();

            //Relational
            builder.HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(r=>r.Order)
                .WithMany()
                .HasForeignKey(r=>r.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(r=>r.Product)
                .WithMany(p=>p.Reviews)
                .HasForeignKey(r=>r.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(r => r.UserId);
            builder.HasIndex(r=>r.ProductId);
            builder.HasIndex(r=>r.IsApproved);
        }
    }
}
