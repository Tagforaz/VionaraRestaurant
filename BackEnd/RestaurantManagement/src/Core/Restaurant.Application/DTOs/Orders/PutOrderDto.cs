

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutOrderDto
    (
        OrderStatus Status,
        Guid? CourierId
        );
    
}
