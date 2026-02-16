
namespace Restaurant.Application.DTOs
{
    public record CourierAssignedDto
    (
         Guid OrderId,
         string OrderNumber,
         Guid CourierId,
         string CourierName,
         string? CourierPhone,
         string? CourierImageUrl,
         string DeliveryAddress,
         DateTime AssignedAt
    );
}
