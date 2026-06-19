using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PublicAccess.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PublicAccessService : IPublicAccessService
{
    private const string Currency = "VND";
    private const string PassPendingPayment = "PendingPayment";
    private const string PassActive = "Active";
    private const string PassExpired = "Expired";
    private const string PassFailed = "Failed";
    private const string SessionPending = "Pending";
    private const string SessionPaid = "Paid";
    private const string SessionFailed = "Failed";
    private const string SessionExpired = "Expired";
    private const string Provider = "SimulatedMoMo";

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public PublicAccessService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<StartAccessResponse> StartAsync(
        StartAccessRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
        {
            throw new ValidationException(nameof(request.QrCode), "QR code is required.");
        }

        var qr = await _uow.QrLocations
            .GetByCodeAsync(request.QrCode.Trim(), activeOnly: true, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("QR code", request.QrCode);

        ValidateQrPaymentConfig(qr);
        if (qr.Poi is not null && !PoiAvailability.IsPubliclyAvailable(qr.Poi, now: DateTime.UtcNow))
        {
            throw new NotFoundException("QR code", request.QrCode);
        }

        var now = DateTime.UtcNow;
        var pass = new GuestAccessPass
        {
            QrLocationId = qr.Id,
            Amount = qr.RequiresPayment ? qr.PriceAmount : 0m,
            Currency = Currency,
            CreatedAt = now,
            UpdatedAt = now,
            ExpiresAt = now.AddMinutes(qr.AccessDurationMinutes),
            IsPaid = !qr.RequiresPayment,
            Status = qr.RequiresPayment ? PassPendingPayment : PassActive
        };

        string? accessToken = null;
        if (!qr.RequiresPayment)
        {
            accessToken = GenerateToken();
            pass.TokenHash = HashToken(accessToken);
            pass.StartsAt = now;
        }

        await _uow.GuestAccessPasses.AddAsync(pass, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        AccessPaymentSession? session = null;
        if (qr.RequiresPayment)
        {
            session = new AccessPaymentSession
            {
                GuestAccessPassId = pass.Id,
                Provider = Provider,
                Status = SessionPending,
                Amount = qr.PriceAmount,
                Currency = Currency,
                CreatedAt = now,
                ExpiresAt = now.AddMinutes(15)
            };

            await _uow.AccessPaymentSessions.AddAsync(session, cancellationToken).ConfigureAwait(false);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        return new StartAccessResponse
        {
            Qr = _mapper.Map<QrDto>(qr),
            RequiresPayment = qr.RequiresPayment,
            Amount = qr.RequiresPayment ? qr.PriceAmount : 0m,
            Currency = Currency,
            AccessDurationMinutes = qr.AccessDurationMinutes,
            PaymentSessionId = session?.Id,
            Status = pass.Status,
            AccessToken = accessToken,
            ExpiresAt = pass.Status == PassActive ? pass.ExpiresAt : null
        };
    }

    public async Task<SimulatePaymentResponse> SimulatePaymentAsync(
        SimulatePaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.PaymentSessionId <= 0)
        {
            throw new ValidationException(nameof(request.PaymentSessionId), "Payment session id is required.");
        }

        var session = await _uow.AccessPaymentSessions
            .GetByIdAsync(request.PaymentSessionId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException("Payment session", request.PaymentSessionId);

        var pass = session.GuestAccessPass;
        var now = DateTime.UtcNow;

        if (session.Status == SessionPaid && pass.Status == PassActive)
        {
            return ToPaymentResponse(pass, accessToken: null);
        }

        if (session.Status != SessionPending || pass.Status != PassPendingPayment)
        {
            return ToPaymentResponse(pass, accessToken: null);
        }

        if (session.ExpiresAt <= now)
        {
            session.Status = SessionExpired;
            pass.Status = PassExpired;
            session.FailureReason = "Payment session expired.";
            pass.UpdatedAt = now;
            _uow.AccessPaymentSessions.Update(session);
            _uow.GuestAccessPasses.Update(pass);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return ToPaymentResponse(pass, accessToken: null);
        }

        if (!request.Success)
        {
            session.Status = SessionFailed;
            pass.Status = PassFailed;
            session.FailureReason = "Simulated payment failed.";
            pass.UpdatedAt = now;
            _uow.AccessPaymentSessions.Update(session);
            _uow.GuestAccessPasses.Update(pass);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return ToPaymentResponse(pass, accessToken: null);
        }

        var token = GenerateToken();
        session.Status = SessionPaid;
        session.PaidAt = now;
        pass.TokenHash = HashToken(token);
        pass.StartsAt = now;
        pass.ExpiresAt = now.AddMinutes(pass.QrLocation.AccessDurationMinutes);
        pass.IsPaid = true;
        pass.Status = PassActive;
        pass.UpdatedAt = now;

        _uow.AccessPaymentSessions.Update(session);
        _uow.GuestAccessPasses.Update(pass);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return ToPaymentResponse(pass, token);
    }

    public async Task<ValidateAccessResponse> ValidateAsync(
        string? accessToken,
        CancellationToken cancellationToken = default)
    {
        var pass = await TryGetPassAsync(accessToken, cancellationToken).ConfigureAwait(false);
        if (pass is null)
        {
            return Invalid(string.IsNullOrWhiteSpace(accessToken) ? "MissingToken" : "InvalidToken");
        }

        return await ValidatePassAsync(pass, cancellationToken).ConfigureAwait(false);
    }

    public async Task<ValidateAccessResponse> ValidateAccessForTourAsync(
        string? accessToken,
        int tourId,
        CancellationToken cancellationToken = default)
    {
        var (_, response) = await RequireActivePassAsync(accessToken, cancellationToken)
            .ConfigureAwait(false);

        if (!response.PoiId.HasValue && !response.TourId.HasValue)
        {
            return response;
        }

        if (response.TourId != tourId)
        {
            throw new ForbiddenException("Guest access pass does not allow this tour.");
        }

        return response;
    }

    public async Task<ValidateAccessResponse> ValidateAccessForPoiAsync(
        string? accessToken,
        int poiId,
        CancellationToken cancellationToken = default)
    {
        var (_, response) = await RequireActivePassAsync(accessToken, cancellationToken)
            .ConfigureAwait(false);

        if (!response.PoiId.HasValue && !response.TourId.HasValue)
        {
            return response;
        }

        if (response.PoiId == poiId)
        {
            return response;
        }

        if (response.TourId.HasValue)
        {
            var tourPoi = await _uow.TourPois
                .GetByTourAndPoiAsync(response.TourId.Value, poiId, cancellationToken)
                .ConfigureAwait(false);

            if (tourPoi is not null)
            {
                return response;
            }
        }

        throw new ForbiddenException("Guest access pass does not allow this POI.");
    }

    public async Task<ValidateAccessResponse> ValidateAccessForAudioTrackAsync(
        string? accessToken,
        int audioTrackId,
        CancellationToken cancellationToken = default)
    {
        var track = await _uow.AudioTracks.GetByIdAsync(audioTrackId, cancellationToken: cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(AudioTrack), audioTrackId);

        return await ValidateAccessForPoiAsync(accessToken, track.POIId, cancellationToken)
            .ConfigureAwait(false);
    }

    private static void ValidateQrPaymentConfig(QrLocation qr)
    {
        if (qr.AccessDurationMinutes <= 0)
        {
            throw new ValidationException(nameof(QrLocation.AccessDurationMinutes), "Access duration must be greater than 0.");
        }

        if (qr.PriceAmount < 0)
        {
            throw new ValidationException(nameof(QrLocation.PriceAmount), "Price amount cannot be negative.");
        }
    }

    private static SimulatePaymentResponse ToPaymentResponse(GuestAccessPass pass, string? accessToken) =>
        new()
        {
            Status = pass.Status,
            AccessToken = accessToken,
            ExpiresAt = pass.Status == PassActive ? pass.ExpiresAt : null,
            QrLocationId = pass.QrLocationId,
            PoiId = pass.QrLocation.PoiId,
            TourId = pass.QrLocation.TourId
        };

    private static ValidateAccessResponse ToValidateResponse(
        GuestAccessPass pass,
        bool isValid,
        DateTime now) =>
        new()
        {
            IsValid = isValid,
            Status = pass.Status,
            ExpiresAt = pass.Status == PassActive ? pass.ExpiresAt : null,
            RemainingSeconds = isValid ? Math.Max(0, (int)(pass.ExpiresAt - now).TotalSeconds) : 0,
            QrLocationId = pass.QrLocationId,
            PoiId = pass.QrLocation.PoiId,
            TourId = pass.QrLocation.TourId
        };

    private static ValidateAccessResponse Invalid(string status) =>
        new()
        {
            IsValid = false,
            Status = status
        };

    private async Task<(GuestAccessPass Pass, ValidateAccessResponse Response)> RequireActivePassAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new UnauthorizedException("Guest access token is required.");
        }

        var pass = await TryGetPassAsync(accessToken, cancellationToken).ConfigureAwait(false)
            ?? throw new UnauthorizedException("Guest access token is invalid.");

        var response = await ValidatePassAsync(pass, cancellationToken).ConfigureAwait(false);
        if (!response.IsValid)
        {
            throw new UnauthorizedException("Guest access pass is not active.");
        }

        return (pass, response);
    }

    private async Task<GuestAccessPass?> TryGetPassAsync(
        string? accessToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return null;
        }

        var tokenHash = HashToken(accessToken.Trim());
        return await _uow.GuestAccessPasses
            .GetByTokenHashAsync(tokenHash, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<ValidateAccessResponse> ValidatePassAsync(
        GuestAccessPass pass,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (pass.Status != PassActive)
        {
            return ToValidateResponse(pass, isValid: false, now);
        }

        if (pass.ExpiresAt <= now)
        {
            pass.Status = PassExpired;
            pass.UpdatedAt = now;
            _uow.GuestAccessPasses.Update(pass);
            await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return ToValidateResponse(pass, isValid: false, now);
        }

        return ToValidateResponse(pass, isValid: true, now);
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
