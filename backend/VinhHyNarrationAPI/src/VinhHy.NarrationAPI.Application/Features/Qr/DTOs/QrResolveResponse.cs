using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class QrResolveResponse
{
    public QrLocationDto QrLocation { get; set; } = null!;

    public PoiDto Poi { get; set; } = null!;
}
