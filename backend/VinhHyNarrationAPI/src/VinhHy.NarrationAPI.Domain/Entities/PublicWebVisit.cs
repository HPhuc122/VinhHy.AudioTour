namespace VinhHy.NarrationAPI.Domain.Entities;

public class PublicWebVisit
{
    public long Id { get; set; }

    public string SessionId { get; set; } = null!;

    public DateOnly VisitDate { get; set; }

    public DateTime FirstSeenAt { get; set; }
}
