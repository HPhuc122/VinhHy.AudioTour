namespace VinhHy.NarrationAPI.Application.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base(message, statusCode: 404)
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.", statusCode: 404)
    {
    }
}
