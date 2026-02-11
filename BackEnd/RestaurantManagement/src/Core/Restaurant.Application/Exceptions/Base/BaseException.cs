

namespace Restaurant.Application.Exceptions
{
    public abstract class BaseException : Exception
    {
        public int StatusCode { get; }
        public string? ErrorCode { get; }

        protected BaseException(string message, int statusCode, string? errorCode = null)
            : base(message)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }

        protected BaseException(string message,Exception innerException,int statusCode, string? errorCode = null)
            :base(message, innerException)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }
    }
}
