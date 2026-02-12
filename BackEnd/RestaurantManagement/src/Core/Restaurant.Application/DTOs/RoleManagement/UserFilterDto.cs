
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record  UserFilterDto
    (
        int Page = 1,
        int Take = 10,
        string? SearchTerm = null,
        UserRole? Role = null,
        bool? IsActive = null,
        DateTime? CreatedAfter = null,
        DateTime? CreatedBefore = null
        );
    
}
