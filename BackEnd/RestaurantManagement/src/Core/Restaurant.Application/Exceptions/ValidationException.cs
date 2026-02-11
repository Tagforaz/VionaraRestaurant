

namespace Restaurant.Application.Exceptions
{
    public class ValidationException :BaseException
    {
        public Dictionary<string, string[]>? Errors { get; }

        public ValidationException(string message)
            : base(message, 400, "VALIDATION_ERROR")
        {

        }
        public ValidationException(Dictionary<string, string[]> errors)
            :base("One or more validation errors occurred", 400, "VALIDATION_ERROR")
        {
            Errors = errors;
        }
    }
}
