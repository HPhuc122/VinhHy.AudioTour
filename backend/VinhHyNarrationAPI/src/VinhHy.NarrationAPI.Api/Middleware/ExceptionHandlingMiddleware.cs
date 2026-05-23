using System.Net;
using System.Text.Json;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using AppValidationException = VinhHy.NarrationAPI.Application.Exceptions.ValidationException;

namespace VinhHy.NarrationAPI.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            AppValidationException validationEx => (
                validationEx.StatusCode,
                ApiResponse.Fail(validationEx.Message, validationEx.Errors)),
            AppException appEx => (
                appEx.StatusCode,
                ApiResponse.Fail(appEx.Message)),
            _ => (
                (int)HttpStatusCode.InternalServerError,
                ApiResponse.Fail("An unexpected error occurred."))
        };

        if (statusCode >= 500)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
        else
        {
            logger.LogWarning(exception, "Handled application exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }
}
