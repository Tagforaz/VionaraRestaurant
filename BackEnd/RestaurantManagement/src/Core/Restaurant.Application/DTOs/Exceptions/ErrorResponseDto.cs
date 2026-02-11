

namespace Restaurant.Application.DTOs
{
    public class ErrorResponseDto
    {
        public int StatusCode { get; set; }
        public string Message { get; set; }=string.Empty;
        public string? ErrorCode { get; set; }  
        public string? Details { get; set; }
        public Dictionary<string, string[]>? Errors {  get; set; }
        public string TimeStamp { get; set; } = DateTime.UtcNow.ToString("yyyy-mm-ddTHH:mm:ssZ");
        public string Path { get; set; } = string.Empty;
    }
}
