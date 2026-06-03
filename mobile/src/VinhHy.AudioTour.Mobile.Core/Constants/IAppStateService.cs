using VinhHy.AudioTour.Mobile.Core.Models;

namespace VinhHy.AudioTour.Mobile.Core.Contracts.Services;

/// <summary>
/// Centralized runtime state cache for the application.
/// Hydrated during bootstrap; updated reactively as state changes.
/// Thread-safe; raises PropertyChanged for UI binding.
/// </summary>
public interface IAppStateService
{
    // ── Identity ─────────────────────────────────────────────────────────────

    /// <summary>Stable device UUID. Never null after bootstrap.</summary>
    string DeviceId { get; }

    // ── Authentication ────────────────────────────────────────────────────────

    /// <summary>True when a valid, non-expired access token exists in memory.</summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Runtime user snapshot. Null when unauthenticated.
    /// Does NOT expose tokens.
    /// </summary>
    AppUserInfo? CurrentUser { get; }

    // ── Preferences ───────────────────────────────────────────────────────────

    /// <summary>
    /// BCP-47 language code currently active for narration and UI.
    /// Falls back to <see cref="AppConstants.DefaultLanguage"/> when unset.
    /// </summary>
    string CurrentLanguage { get; }

    // ── Tour session ──────────────────────────────────────────────────────────

    /// <summary>ID of the tour currently running. Null when no tour is active.</summary>
    int? CurrentTourId { get; }

    // ── Connectivity ──────────────────────────────────────────────────────────

    bool IsOnline { get; }

    // ── Mutations ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Hydrates all state from persistent sources. Called once during
    /// <see cref="IAppBootstrapService.BootstrapAsync"/>.
    /// </summary>
    Task HydrateAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Applies the authenticated user snapshot from the active session.
    /// Called after a successful login or session restore.
    /// </summary>
    void ApplyAuthSession(AuthSession? session);

    /// <summary>Updates the active language and persists the preference.</summary>
    Task SetLanguageAsync(string languageCode, CancellationToken cancellationToken = default);

    /// <summary>Sets or clears the active tour ID.</summary>
    void SetCurrentTour(int? tourId);

    /// <summary>Reflects a connectivity change from <see cref="IConnectivityMonitor"/>.</summary>
    void SetOnlineStatus(bool isOnline);

    /// <summary>Clears authenticated user state (called on logout).</summary>
    void ClearAuthState();
}
