using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Infrastructure.Data;
using VinhHy.NarrationAPI.Infrastructure.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/presence")]
public class PresenceController(PresenceStore presence, ApplicationDbContext db) : ControllerBase
{
    private const string DeviceHeader = "X-Guest-Device-Id";
    private const int MaxSessionIdLength = 128;
    private static readonly TimeSpan IctOffset = TimeSpan.FromHours(7);

    /// <summary>
    /// Heartbeat — called by the public web every ~20 s while the page is open.
    /// Body: { "poiId": "ABC-001" } (optional — omit when on a non-POI page).
    /// </summary>
    [HttpPost("heartbeat")]
    [AllowAnonymous]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest? body, CancellationToken cancellationToken)
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            return BadRequest("Missing X-Guest-Device-Id header.");
        }

        if (sessionId.Length > MaxSessionIdLength)
        {
            return BadRequest("X-Guest-Device-Id is too long.");
        }

        var nowUtc = DateTime.UtcNow;
        var visitDate = DateOnly.FromDateTime(nowUtc.Add(IctOffset));
        var shouldPersistVisit = presence.Heartbeat(sessionId, body?.PoiId?.Trim(), visitDate);
        if (shouldPersistVisit)
        {
            await RecordDailyVisitAsync(sessionId, visitDate, nowUtc, cancellationToken).ConfigureAwait(false);
        }

        return Ok(new { active = presence.CountActive() });
    }

    /// <summary>
    /// Leave — called via navigator.sendBeacon on page unload so the count drops immediately.
    /// </summary>
    [HttpPost("leave")]
    [AllowAnonymous]
    public IActionResult Leave()
    {
        var sessionId = GetSessionId();
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            presence.Leave(sessionId);
        }

        return Ok();
    }

    /// <summary>
    /// Read-only count — polled by the dashboard every ~30 s.
    /// </summary>
    [HttpGet("count")]
    [Authorize] // only admin/analytics roles read this
    public IActionResult Count([FromQuery] string? poiId)
    {
        var count = string.IsNullOrWhiteSpace(poiId)
            ? presence.CountActive()
            : presence.CountActiveByPoi(poiId);

        return Ok(new { active = count });
    }

    private string? GetSessionId() =>
        Request.Headers.TryGetValue(DeviceHeader, out var value)
            ? value.FirstOrDefault()?.Trim()
            : null;

    private async Task RecordDailyVisitAsync(
        string sessionId,
        DateOnly visitDate,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var exists = await db.PublicWebVisits
            .AsNoTracking()
            .AnyAsync(v => v.SessionId == sessionId && v.VisitDate == visitDate, cancellationToken)
            .ConfigureAwait(false);

        if (exists)
        {
            return;
        }

        db.PublicWebVisits.Add(new PublicWebVisit
        {
            SessionId = sessionId,
            VisitDate = visitDate,
            FirstSeenAt = nowUtc
        });

        try
        {
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
        }
    }
}

public record HeartbeatRequest(string? PoiId);
