namespace CrmApi.Services;

/// <summary>
/// Dev-only stand-in for <see cref="FileStorageService"/> — writes to a local ./uploads
/// folder instead of Azure Blob Storage, so file upload works without real cloud
/// credentials. Swapped in for <see cref="IFileStorageService"/> only when
/// IsDevelopment() — see Program.cs. Files are served back via app.UseStaticFiles()
/// at /uploads/{blobName}.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadsRoot;
    private readonly string _baseUrl;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IConfiguration config, IWebHostEnvironment env, ILogger<LocalFileStorageService> logger)
    {
        _uploadsRoot = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_uploadsRoot);
        _baseUrl = config["Backend:BaseUrl"] ?? "http://localhost:5051";
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        var blobName = $"client-note-documents/{Guid.NewGuid()}_{fileName}";
        var fullPath = Path.Combine(_uploadsRoot, blobName.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var file = File.Create(fullPath);
        await fileStream.CopyToAsync(file);

        _logger.LogInformation("File written to local uploads folder as {BlobName}", blobName);
        return blobName;
    }

    public string GetDownloadUrl(string blobName, TimeSpan expiry)
    {
        // No SAS tokens locally — the static files middleware serves this path directly.
        return $"{_baseUrl}/uploads/{blobName}";
    }
}
