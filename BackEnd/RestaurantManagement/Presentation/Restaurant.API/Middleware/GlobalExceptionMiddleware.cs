using Azure;
using Restaurant.Application.DTOs;
using Restaurant.Application.Exceptions;
using System.Net;
using System.Text.Json;

namespace Restaurant.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occured: {Message}",ex.Message);
                await HandleExceptionAsync(context,ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context,Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = exception switch
            {
                BaseException baseEx => new ErrorResponseDto
                {
                    StatusCode = baseEx.StatusCode,
                    Message = baseEx.Message,
                    ErrorCode = baseEx.ErrorCode,
                    Details = _env.IsDevelopment() ? baseEx.StackTrace : null,
                    Errors = baseEx is ValidationException validationEx ? validationEx.Errors : null,
                    Path = context.Request.Path
                },
                ArgumentException argEx=>new ErrorResponseDto
                {
                    StatusCode =400,
                    Message = argEx.Message,
                    ErrorCode = "VALIDATION_ERROR",
                    Details= _env.IsDevelopment() ? argEx.StackTrace : null,
                    Path= context.Request.Path
                },
                InvalidOperationException invEx => new ErrorResponseDto
                {
                    StatusCode = 400,
                    Message = invEx.Message,
                    ErrorCode = "INVALID_OPERATION",
                    Details = _env.IsDevelopment() ? invEx.StackTrace : null,
                    Path= context.Request.Path
                },
                KeyNotFoundException => new ErrorResponseDto
                {
                    StatusCode = 404,
                    Message= "The Requested resource was not found",
                    ErrorCode="NOT_FOUND",
                    Path=context.Request.Path
                },
                UnauthorizedAccessException => new ErrorResponseDto
                {
                    StatusCode =401,
                    Message="Unauthorized acces",
                    ErrorCode="UNAUTHORIZED",
                    Path=context.Request.Path
                },
                _ => new ErrorResponseDto
                 {
                     StatusCode = (int)HttpStatusCode.InternalServerError,
                     Message = "An internal server error occurred",
                     ErrorCode = "INTERNAL_ERROR",
                     Details = _env.IsDevelopment() ? exception.Message : null,
                     Path = context.Request.Path
                 }
            };
            context.Response.StatusCode = response.StatusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };

            await context.Response.WriteAsJsonAsync(response, options);
        }
    }
}
