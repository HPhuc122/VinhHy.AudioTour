namespace VinhHy.NarrationAPI.Application.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Forbidden.")
        : base(message, statusCode: 403)
    {
    }
}
