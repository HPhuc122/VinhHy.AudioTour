using Microsoft.Maui.Storage;
using SQLite;

namespace VinhHy.AudioTour.Mobile.Data.Database;

public sealed class LocalDatabase : IAsyncDisposable
{
    private const string DatabaseFileName = "vinhhy_audiotour.db";

    private readonly SemaphoreSlim _connectionLock = new(1, 1);
    private SQLiteAsyncConnection? _connection;
    private bool _initialized;
    private bool _disposed;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        await _connectionLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_initialized)
            {
                return;
            }

            var path = Path.Combine(FileSystem.AppDataDirectory, DatabaseFileName);
            _connection = new SQLiteAsyncConnection(
                path,
                SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.FullMutex);

            await _connection.ExecuteAsync("PRAGMA journal_mode=WAL;").ConfigureAwait(false);
            await _connection.ExecuteAsync("PRAGMA foreign_keys=ON;").ConfigureAwait(false);

            foreach (var statement in SqlSchema.GetBootstrapStatements())
            {
                await _connection.ExecuteAsync(statement).ConfigureAwait(false);
            }

            await LocalDatabaseMigrator.MigrateAsync(_connection).ConfigureAwait(false);

            await _connection.ExecuteAsync($"PRAGMA user_version = {SqlSchema.UserVersion};")
                .ConfigureAwait(false);

            _initialized = true;
        }
        finally
        {
            _connectionLock.Release();
        }
    }

    /// <summary>
    /// Returns the underlying connection after initialization. Prefer <see cref="ExecuteAsync"/>
    /// for thread-safe access.
    /// </summary>
    public async Task<SQLiteAsyncConnection> GetConnectionAsync(CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (!_initialized)
        {
            await InitializeAsync(cancellationToken).ConfigureAwait(false);
        }

        if (_connection is null)
        {
            throw new InvalidOperationException("Database connection is not available.");
        }

        return _connection;
    }

    public async Task ExecuteAsync(
        Func<SQLiteAsyncConnection, Task> operation,
        CancellationToken cancellationToken = default)
    {
        await ExecuteAsync<object?>(
                async connection =>
                {
                    await operation(connection).ConfigureAwait(false);
                    return null;
                },
                cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<T> ExecuteAsync<T>(
        Func<SQLiteAsyncConnection, Task<T>> operation,
        CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (!_initialized)
        {
            await InitializeAsync(cancellationToken).ConfigureAwait(false);
        }

        await _connectionLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            return await operation(_connection!).ConfigureAwait(false);
        }
        finally
        {
            _connectionLock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;

        await _connectionLock.WaitAsync().ConfigureAwait(false);
        try
        {
            if (_connection is not null)
            {
                await _connection.CloseAsync().ConfigureAwait(false);
                _connection = null;
            }
        }
        finally
        {
            _connectionLock.Release();
            _connectionLock.Dispose();
        }
    }
}
