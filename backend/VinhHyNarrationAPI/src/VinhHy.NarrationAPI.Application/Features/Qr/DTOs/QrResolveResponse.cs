using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;

namespace VinhHy.NarrationAPI.Application.Features.Qr.DTOs;

public class QrResolveResponse
{
    public QrDto Qr { get; set; } = null!;

    public PoiDto? Poi { get; set; }

    public TourDto? Tour { get; set; }
}
