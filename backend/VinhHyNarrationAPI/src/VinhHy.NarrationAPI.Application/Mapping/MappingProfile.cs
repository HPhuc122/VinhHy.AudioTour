using AutoMapper;
using System.Text.Json;
using VinhHy.NarrationAPI.Application.Features.Analytics.DTOs;
using VinhHy.NarrationAPI.Application.Features.Audio.DTOs;
using VinhHy.NarrationAPI.Application.Features.Audit.DTOs;
using VinhHy.NarrationAPI.Application.Features.Devices.DTOs;
using VinhHy.NarrationAPI.Application.Features.Geofence.DTOs;
using VinhHy.NarrationAPI.Application.Features.Languages.DTOs;
using VinhHy.NarrationAPI.Application.Features.Media.DTOs;
using VinhHy.NarrationAPI.Application.Features.NarrationLogs.DTOs;
using VinhHy.NarrationAPI.Application.Features.OfflinePackages.DTOs;
using VinhHy.NarrationAPI.Application.Features.Pois.DTOs;
using VinhHy.NarrationAPI.Application.Features.PoiTranslations.DTOs;
using VinhHy.NarrationAPI.Application.Features.Qr.DTOs;
using VinhHy.NarrationAPI.Application.Features.Sync.DTOs;
using VinhHy.NarrationAPI.Application.Features.Tours.DTOs;
using VinhHy.NarrationAPI.Application.Features.Users.DTOs;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Application.Features.Roles.DTOs;

namespace VinhHy.NarrationAPI.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.RoleName, opt => opt.MapFrom(s => s.Role.Name));
        CreateMap<Role, RoleDto>();

        CreateMap<CreateUserRequest, User>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.PasswordHash, opt => opt.Ignore())
            .ForMember(d => d.RefreshToken, opt => opt.Ignore())
            .ForMember(d => d.RefreshTokenExpiry, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Role, opt => opt.Ignore())
            .ForMember(d => d.Devices, opt => opt.Ignore())
            .ForMember(d => d.NarrationLogs, opt => opt.Ignore())
            .ForMember(d => d.SyncHistories, opt => opt.Ignore())
            .ForMember(d => d.DeletedRecords, opt => opt.Ignore())
            .ForMember(d => d.AuditLogs, opt => opt.Ignore())
            .ForMember(d => d.ContentVersions, opt => opt.Ignore())
            .ForMember(d => d.Pois, opt => opt.Ignore());

        CreateMap<Poi, PoiDto>()
            .ForMember(d => d.ImageUrls, opt => opt.MapFrom(s => DeserializeImageUrls(s.ImageUrls)))
            .ForMember(
                d => d.DisplayName,
                opt => opt.MapFrom(s =>
                    !string.IsNullOrWhiteSpace(s.Name)
                        ? s.Name
                        : s.Translations
                        .OrderBy(t => t.LanguageCode == "vi" ? 0 : 1)
                        .ThenBy(t => t.LanguageCode)
                        .Select(t => t.Name)
                        .FirstOrDefault() ?? s.Code));
        CreateMap<CreatePoiRequest, Poi>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Code, opt => opt.Ignore())
            .ForMember(d => d.UserId, opt => opt.Ignore())
            .ForMember(d => d.User, opt => opt.Ignore())
            .ForMember(d => d.ImageUrl, opt => opt.Ignore())
            .ForMember(d => d.ImageUrls, opt => opt.Ignore())
            .ForMember(d => d.DeletedAt, opt => opt.Ignore())
            .ForMember(d => d.Version, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Translations, opt => opt.Ignore())
            .ForMember(d => d.AudioTracks, opt => opt.Ignore())
            .ForMember(d => d.TourPois, opt => opt.Ignore())
            .ForMember(d => d.QrLocations, opt => opt.Ignore())
            .ForMember(d => d.NarrationLogs, opt => opt.Ignore())
            .ForMember(d => d.AnalyticsDaily, opt => opt.Ignore());

        CreateMap<Poi, SyncablePoiDto>()
            .ForMember(d => d.ImageUrls, opt => opt.MapFrom(s => DeserializeImageUrls(s.ImageUrls)));
        CreateMap<Poi, GeofenceConfigDto>()
            .ForMember(d => d.POIId, opt => opt.MapFrom(s => s.Id))
            .ForMember(d => d.PoiCode, opt => opt.MapFrom(s => s.Code));

        CreateMap<PoiTranslation, PoiTranslationDto>();
        CreateMap<CreatePoiTranslationRequest, PoiTranslation>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Version, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Poi, opt => opt.Ignore());
        CreateMap<PoiTranslation, SyncablePoiTranslationDto>();

        CreateMap<AudioTrack, AudioTrackDto>();
        CreateMap<CreateAudioTrackRequest, AudioTrack>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.DeletedAt, opt => opt.Ignore())
            .ForMember(d => d.Version, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Poi, opt => opt.Ignore());
        CreateMap<AudioTrack, SyncableAudioTrackDto>();

        CreateMap<MediaFile, MediaFileDto>()
            .ForMember(d => d.PublicUrl, opt => opt.Ignore())
            .ForMember(d => d.UploadedByUsername, opt => opt.MapFrom(s => s.UploadedByUser != null ? s.UploadedByUser.Username : null))
            .ForMember(d => d.ReviewedByUsername, opt => opt.MapFrom(s => s.ReviewedByUser != null ? s.ReviewedByUser.Username : null));

        CreateMap<Tour, TourDto>()
            .ForMember(d => d.Pois, opt => opt.MapFrom(s => s.TourPois))
            .ForMember(d => d.Translations, opt => opt.MapFrom(s => s.Translations));
        CreateMap<CreateTourRequest, Tour>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Code, opt => opt.Ignore())
            .ForMember(d => d.DeletedAt, opt => opt.Ignore())
            .ForMember(d => d.Version, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Translations, opt => opt.Ignore())
            .ForMember(d => d.TourPois, opt => opt.Ignore())
            .ForMember(d => d.OfflinePackages, opt => opt.Ignore());
        CreateMap<Tour, SyncableTourDto>();

        CreateMap<TourTranslation, TourTranslationDto>();
        CreateMap<CreateTourTranslationRequest, TourTranslation>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.TourId, opt => opt.Ignore())
            .ForMember(d => d.Tour, opt => opt.Ignore());
        CreateMap<TourTranslation, SyncableTourTranslationDto>();

        CreateMap<TourPoi, TourPoiDto>()
            .ForMember(d => d.PoiCode, opt => opt.MapFrom(s => s.Poi.Code))
            .ForMember(
                d => d.PoiName,
                opt => opt.MapFrom(s =>
                    s.Poi.Translations
                        .OrderBy(t => t.LanguageCode == "vi" ? 0 : 1)
                        .ThenBy(t => t.LanguageCode)
                        .Select(t => t.Name)
                        .FirstOrDefault() ?? s.Poi.Code));

        CreateMap<QrLocation, QrDto>()
            .ForMember(d => d.PoiCode, opt => opt.MapFrom(s => s.Poi != null ? s.Poi.Code : null))
            .ForMember(d => d.TourCode, opt => opt.MapFrom(s => s.Tour != null ? s.Tour.Code : null));
        CreateMap<CreateQrRequest, QrLocation>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.DeletedAt, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Poi, opt => opt.Ignore())
            .ForMember(d => d.Tour, opt => opt.Ignore())
            .ForMember(d => d.GuestAccessPasses, opt => opt.Ignore());
        CreateMap<QrLocation, SyncableQrLocationDto>();

        CreateMap<Language, LanguageDto>();
        CreateMap<Language, SyncableLanguageDto>();

        CreateMap<OfflinePackage, OfflinePackageDto>();
        CreateMap<CreateOfflinePackageRequest, OfflinePackage>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.PublishedAt, opt => opt.Ignore())
            .ForMember(d => d.Tour, opt => opt.Ignore());
        CreateMap<OfflinePackage, SyncableOfflinePackageDto>();

        CreateMap<DeletedRecord, DeletedRecordDto>();

        CreateMap<NarrationLog, NarrationLogDto>();
        CreateMap<CreateNarrationLogRequest, NarrationLog>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.Synced, opt => opt.Ignore())
            .ForMember(d => d.User, opt => opt.Ignore())
            .ForMember(d => d.Poi, opt => opt.Ignore())
            .ForMember(d => d.Device, opt => opt.Ignore())
            .ForMember(d => d.PlayedAt, opt => opt.MapFrom(s => s.PlayedAt ?? DateTime.UtcNow));

        CreateMap<SyncNarrationLogItem, NarrationLog>()
            .ForMember(d => d.Id, opt => opt.Ignore())
            .ForMember(d => d.UserId, opt => opt.Ignore())
            .ForMember(d => d.Synced, opt => opt.MapFrom(_ => true))
            .ForMember(d => d.User, opt => opt.Ignore())
            .ForMember(d => d.Poi, opt => opt.Ignore())
            .ForMember(d => d.Device, opt => opt.Ignore());

        CreateMap<AnalyticsDaily, AnalyticsDailyDto>()
            .ForMember(d => d.PoiCode, opt => opt.MapFrom(s => s.Poi.Code));

        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User != null ? s.User.Username : null));

        CreateMap<Device, DeviceDto>();
    }

    private static IReadOnlyList<string> DeserializeImageUrls(string? imageUrls)
    {
        if (string.IsNullOrWhiteSpace(imageUrls))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(imageUrls) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
