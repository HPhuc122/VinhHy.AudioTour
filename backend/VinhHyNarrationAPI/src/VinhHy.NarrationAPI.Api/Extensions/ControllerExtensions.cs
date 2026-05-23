using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Application.Common;

namespace VinhHy.NarrationAPI.Api.Extensions;

public static class ControllerExtensions
{
    public static IActionResult ApiOk<T>(this ControllerBase controller, T data, string message = "Success") =>
        controller.Ok(ApiResponse<T>.Ok(data, message));

    public static IActionResult ApiOk(this ControllerBase controller, string message = "Success") =>
        controller.Ok(ApiResponse.Ok(message));

    public static IActionResult ApiFail(
        this ControllerBase controller,
        string message,
        int statusCode = 400,
        IDictionary<string, string[]>? errors = null) =>
        controller.StatusCode(statusCode, ApiResponse.Fail(message, errors));
}
