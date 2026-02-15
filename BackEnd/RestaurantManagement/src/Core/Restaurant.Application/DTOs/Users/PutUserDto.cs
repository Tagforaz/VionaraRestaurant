

namespace Restaurant.Application.DTOs
{
    public record PutUserDto(
        string FirstName,
        string LastName,
        string? PhoneNumber,    
        string? FullAddress    
    );

}
