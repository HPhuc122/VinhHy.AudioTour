using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Features.Narrations.DTOs;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

public interface INarrationDraftService
{
    Task<PagedResult<NarrationDraftDto>> SearchAsync(
        NarrationDraftListRequest request,
        CancellationToken cancellationToken = default);

    Task<NarrationDraftDto> CreateAsync(
        CreateNarrationDraftRequest request,
        int submittedByUserId,
        bool autoApprove,
        bool requireOwnedPoi,
        CancellationToken cancellationToken = default);

    Task<NarrationDraftDto> ApproveAsync(
        int id,
        int reviewerUserId,
        CancellationToken cancellationToken = default);

    Task<NarrationDraftDto> RejectAsync(
        int id,
        int reviewerUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task<GenerateNarrationTranslationsResponse> GenerateTranslationsAsync(
        int sourceDraftId,
        GenerateNarrationTranslationsRequest request,
        int reviewerUserId,
        CancellationToken cancellationToken = default);

    Task<NarrationDraftDto> GenerateAudioAsync(
        int id,
        int reviewerUserId,
        CancellationToken cancellationToken = default);

    Task<NarrationDraftDto> UploadAudioAsync(
        int id,
        UploadNarrationAudioRequest request,
        int uploadedByUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Admin: xóa draft + AudioTrack liên quan trong mọi trạng thái.
    /// Vendor: chỉ xóa được khi Status = Pending và phải là người đã nộp.
    /// </summary>
    Task DeleteAsync(
        int id,
        int requestingUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}
