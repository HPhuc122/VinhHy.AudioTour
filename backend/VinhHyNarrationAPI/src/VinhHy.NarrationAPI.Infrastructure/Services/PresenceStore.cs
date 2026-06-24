namespace VinhHy.NarrationAPI.Infrastructure.Services;

/// <summary>
/// In-memory presence store. Tracks which browser sessions are currently viewing the public web.
/// No DB required — data is ephemeral by design: correct for "right now" semantics, auto-clears on restart.
/// </summary>
public sealed class PresenceStore
{
    private readonly record struct Entry(string? PoiId, DateTimeOffset LastSeen);

    private readonly Dictionary<string, Entry> _sessions = new(StringComparer.Ordinal);
    private readonly Lock _lock = new();

    /// <summary>Timeout after which a session is considered gone (no heartbeat).</summary>
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(45);

    /// <summary>
    /// Record (or refresh) a heartbeat from a session.
    /// </summary>
    /// <param name="sessionId">Stable anonymous id from the browser (e.g. localStorage uuid).</param>
    /// <param name="poiId">Optional POI the session is currently viewing.</param>
    public void Heartbeat(string sessionId, string? poiId)
    {
        lock (_lock)
        {
            _sessions[sessionId] = new Entry(poiId, DateTimeOffset.UtcNow);
        }
    }

    /// <summary>Remove a session immediately (called on page unload via beacon).</summary>
    public void Leave(string sessionId)
    {
        lock (_lock)
        {
            _sessions.Remove(sessionId);
        }
    }

    /// <summary>Total active sessions (heartbeat within timeout window).</summary>
    public int CountActive()
    {
        var cutoff = DateTimeOffset.UtcNow - Timeout;
        lock (_lock)
        {
            return _sessions.Values.Count(e => e.LastSeen >= cutoff);
        }
    }

    /// <summary>Active sessions currently viewing a specific POI.</summary>
    public int CountActiveByPoi(string poiId)
    {
        var cutoff = DateTimeOffset.UtcNow - Timeout;
        lock (_lock)
        {
            return _sessions.Values.Count(e => e.LastSeen >= cutoff && e.PoiId == poiId);
        }
    }

    /// <summary>Purge stale sessions (call periodically to avoid unbounded growth).</summary>
    public void Purge()
    {
        var cutoff = DateTimeOffset.UtcNow - Timeout;
        lock (_lock)
        {
            var stale = _sessions.Where(kv => kv.Value.LastSeen < cutoff).Select(kv => kv.Key).ToList();
            foreach (var key in stale)
            {
                _sessions.Remove(key);
            }
        }
    }
}
