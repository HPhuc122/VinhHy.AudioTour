using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Application.Features.Pois.DTOs;

public class UpdatePoiApprovalStatusRequest
{
    public ApprovalStatus ApprovalStatus { get; set; }
}
