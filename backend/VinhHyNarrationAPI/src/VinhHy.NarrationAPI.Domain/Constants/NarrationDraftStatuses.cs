namespace VinhHy.NarrationAPI.Domain.Constants;

public static class NarrationDraftStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string AudioGenerated = "AudioGenerated";
    public const string Translating = "Translating"; // Auto-translate+TTS pipeline đang chạy
}
