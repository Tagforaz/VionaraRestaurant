

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutOrderDto
    {
        public OrderStatus? Status { get; set; }  
        public Guid? CourierId { get; set; }
    };
    
}
