namespace VinhHy.NarrationAPI.Infrastructure.Options;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = null!;

    public string Issuer { get; set; } = "VinhHy.NarrationAPI";

    public string Audience { get; set; } = "VinhHy.NarrationAPI";

    public int AccessTokenExpirationMinutes { get; set; } = 60;

    public int RefreshTokenExpirationDays { get; set; } = 7;
}
