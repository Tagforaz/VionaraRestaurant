

namespace Restaurant.Application.DTOs
{
    public  record GetOrderItemDto
    (
        Guid Id,
        Guid ProductId,
        string ProductName,
        decimal Price,
        int Quantity,
        decimal TotalPrice
        );
    
}
