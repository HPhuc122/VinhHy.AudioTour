using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VinhHy.NarrationAPI.Infrastructure.Services;

namespace VinhHy.NarrationAPI.Api.Controllers;

[ApiController]
[Route("api/v1/public/presence")]
[AllowAnonymous]
public class PresenceController(PresenceStore presence) : ControllerBase
{
    private const string DeviceHeader = "X-Guest-Device-Id";

    /// <summary>
    /// Heartbeat — called by the public web every ~20 s while the page is open.
    /// Body: { "poiId": "ABC-001" } (optional — omit when on a non-POI page).
    /// </summary>
    [HttpPost("heartbeat")]
    public IActionResult Heartbeat([FromBody] HeartbeatRequest? body)
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            return BadRequest("Missing X-Guest-Device-Id header.");
        }

        presence.Heartbeat(sessionId, body?.PoiId?.Trim());
        return Ok(new { active = presence.CountActive() });
    }

    /// <summary>
    /// Leave — called via navigator.sendBeacon on page unload so the count drops immediately.
    /// </summary>
    [HttpPost("leave")]
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
}

public record HeartbeatRequest(string? PoiId);
