using System.Text.Json;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class AuditLogWriter
{
    private readonly IAuditLogRepository _auditLogs;

    public AuditLogWriter(IAuditLogRepository auditLogs) => _auditLogs = auditLogs;

    public async Task WriteAsync(
        string tableName,
        string recordId,
        string action,
        int? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        CancellationToken cancellationToken = default)
    {
        await _auditLogs.AddAsync(
            new AuditLog
            {
                TableName = tableName,
                RecordId = recordId,
                Action = action,
                UserId = userId,
                OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
                NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
                IPAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            },
            cancellationToken).ConfigureAwait(false);
    }
}
