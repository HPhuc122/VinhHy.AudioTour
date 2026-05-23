namespace VinhHy.NarrationAPI.Application.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Unauthorized.")
        : base(message, statusCode: 401)
    {
    }
}
