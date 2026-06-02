using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Database;

/// <summary>
/// Applies incremental schema upgrades using PRAGMA user_version.
/// </summary>
public static class LocalDatabaseMigrator
{
    public static async Task MigrateAsync(SQLiteAsyncConnection connection)
    {
        var currentVersion = await connection.ExecuteScalarAsync<int>("PRAGMA user_version;")
            .ConfigureAwait(false);

        if (currentVersion < 2)
        {
            foreach (var statement in SqlSchema.GetVersion2UpgradeStatements())
            {
                await connection.ExecuteAsync(statement).ConfigureAwait(false);
            }

            await connection.ExecuteAsync("PRAGMA user_version = 2;").ConfigureAwait(false);
        }
    }
}
