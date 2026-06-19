using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VinhHy.NarrationAPI.Api.Authorization;
using VinhHy.NarrationAPI.Api.Extensions;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Constants;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/pois")]
[Authorize(Roles = RoleGroups.VendorPoiAccess)]
public class PoisController(IPoiService poiService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.GetByIdAsync(id, cancellationToken);
        if (poi is null)
        {
            throw new NotFoundException("POI", id);
        }

        return this.ApiOk(poi);
    }

    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var poi = await poiService.GetByCodeAsync(code, cancellationToken);
        if (poi is null)
        {
            throw new NotFoundException("POI", code);
        }

        return this.ApiOk(poi);
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] ApprovalStatus? approvalStatus = null,
        [FromQuery] PoiLifecycleStatus? lifecycleStatus = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        var result = await poiService.GetPagedAsync(page, pageSize, search, category, isActive, approvalStatus, lifecycleStatus, includeDeleted, cancellationToken);
        return this.ApiOk(result);
    }

    [HttpPost]
    [Authorize(Roles = RoleGroups.VendorPoiRegistration)]
    // Đổi [FromBody] thành [FromForm] ở dòng dưới này:
    public async Task<IActionResult> Create([FromForm] CreatePoiRequest request, CancellationToken cancellationToken)
    {
        var poi = await poiService.CreateAsync(request, cancellationToken);
        return this.ApiOk(poi, "POI created");
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleGroups.VendorPoiRegistration)]
    public async Task<IActionResult> Update(
        int id,
        // Đổi [FromBody] thành [FromForm] ở dòng dưới này:
        [FromForm] UpdatePoiRequest request,
        CancellationToken cancellationToken)
    {
        var poi = await poiService.UpdateAsync(id, request, cancellationToken);
        return this.ApiOk(poi, "POI updated");
    }

    [HttpPut("{id:int}/approval-status")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> UpdateApprovalStatus(
        int id,
        [FromBody] UpdatePoiApprovalStatusRequest request,
        CancellationToken cancellationToken)
    {
        var poi = await poiService.UpdateApprovalStatusAsync(id, request, cancellationToken);
        return this.ApiOk(poi, "POI approval status updated");
    }

    [HttpPost("{id:int}/approve-review")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> ApproveReview(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.ApproveReviewAsync(id, cancellationToken);
        return this.ApiOk(poi, "POI review approved");
    }

    [HttpPost("{id:int}/request-payment")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> RequestPayment(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.RequestPaymentAsync(id, cancellationToken);
        return this.ApiOk(poi, "POI moved to pending payment");
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Reject(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.RejectAsync(id, cancellationToken);
        return this.ApiOk(poi, "POI rejected");
    }

    [HttpPost("{id:int}/mark-paid")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> MarkPaid(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.MarkPaidAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(poi, "POI marked as paid and activated");
    }

    [HttpPost("{id:int}/waive-payment")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> WaivePayment(int id, CancellationToken cancellationToken)
    {
        var poi = await poiService.WaivePaymentAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(poi, "POI payment waived and activated");
    }

    [HttpPost("{id:int}/payment/start")]
    [Authorize(Roles = RoleNames.Vendor)]
    public async Task<IActionResult> StartPayment(int id, CancellationToken cancellationToken)
    {
        var result = await poiService.StartPaymentAsync(id, GetRequiredCurrentUserId(), cancellationToken);
        return this.ApiOk(result, "Simulated MoMo payment session started");
    }

    [HttpPost("{id:int}/payment/simulate-momo")]
    [Authorize(Roles = RoleNames.Vendor)]
    public async Task<IActionResult> SimulateMomoPayment(
        int id,
        [FromBody] SimulatePoiPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await poiService.SimulateMomoPaymentAsync(
            id,
            GetRequiredCurrentUserId(),
            request,
            cancellationToken);

        return this.ApiOk(result, "Simulated MoMo payment processed");
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await poiService.DeleteAsync(id, cancellationToken);
        return this.ApiOk("POI deleted");
    }

    [HttpPut("{id:int}/restore")]
    [Authorize(Roles = RoleGroups.ContentManagement)]
    public async Task<IActionResult> Restore(int id, CancellationToken cancellationToken)
    {
        await poiService.RestoreAsync(id, cancellationToken);
        return NoContent();
    }

    private int GetRequiredCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedException("Missing authenticated user id.");
    }
}
