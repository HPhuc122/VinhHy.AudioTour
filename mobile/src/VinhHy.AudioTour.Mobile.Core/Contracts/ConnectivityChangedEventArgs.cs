namespace VinhHy.AudioTour.Mobile.Core.Contracts;

public class ConnectivityChangedEventArgs : EventArgs
{
    public ConnectivityChangedEventArgs(bool isConnected)
    {
        IsConnected = isConnected;
    }

    public bool IsConnected { get; }
}
