

namespace Restaurant.Application.DTOs
{
    public record GetOrderItemDto
    {
        public Guid Id { get; init; }
        public Guid ProductId { get; init; }
        public string ProductName { get; init; } = string.Empty;
        public decimal Price { get; init; }
        public int Quantity { get; init; }
        public decimal TotalPrice { get; init; }
    }

}
