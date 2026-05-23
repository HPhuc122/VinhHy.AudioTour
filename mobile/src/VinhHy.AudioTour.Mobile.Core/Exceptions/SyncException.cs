namespace VinhHy.AudioTour.Mobile.Core.Exceptions;

public class SyncException : Exception
{
    public SyncException()
    {
    }

    public SyncException(string message)
        : base(message)
    {
    }

    public SyncException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
