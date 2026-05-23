namespace VinhHy.NarrationAPI.Application.Features.Auth.DTOs;

public class DeviceRegistrationResponse
{
    public int Id { get; set; }

    public string DeviceId { get; set; } = null!;

    public string Platform { get; set; } = null!;

    public DateTime RegisteredAt { get; set; }
}
