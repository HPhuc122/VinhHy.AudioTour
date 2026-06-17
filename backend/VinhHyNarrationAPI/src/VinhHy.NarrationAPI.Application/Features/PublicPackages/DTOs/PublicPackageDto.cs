namespace VinhHy.NarrationAPI.Application.Features.PublicPackages.DTOs;

public class PublicPackageDto
{
    public string Code { get; set; } = null!;

    public bool RequiresPayment { get; set; }

    public decimal PriceAmount { get; set; }

    public int AccessDurationMinutes { get; set; }

    public string PublicQrUrl { get; set; } = null!;
}
