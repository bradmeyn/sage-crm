using CrmApi.Models;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Services;

// Define the IFileNoteService interface 
public interface IFileNoteService
{
    Task<List<FileNote>> GetNotesAsync(Guid clientId);
    Task<FileNote?> GetNoteByIdAsync(Guid clientId, Guid noteId);
    Task<FileNoteDocument?> GetDocumentAsync(Guid clientId, Guid noteId, Guid documentId);
    Task<FileNote> CreateNoteAsync(FileNote note, List<IFormFile>? files, Guid userId);
    Task<bool> UpdateNoteAsync(FileNote note, List<IFormFile>? files, Guid userId);
    Task<bool> DeleteNoteAsync(Guid clientId, Guid noteId);
}


public class FileNoteService : IFileNoteService
{
    private readonly ApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<FileNoteService> _logger;

    public FileNoteService(
        ApplicationDbContext context,
        IFileStorageService fileStorageService,
        ILogger<FileNoteService> logger)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

    public async Task<List<FileNote>> GetNotesAsync(Guid clientId)
    {
        return await _context.FileNotes
            .Where(n => n.ClientId == clientId)
            .Include(n => n.Documents)
            .ToListAsync();
    }

    public async Task<FileNote?> GetNoteByIdAsync(Guid clientId, Guid noteId)
    {
        return await _context.FileNotes
            .Include(n => n.Documents)
            .FirstOrDefaultAsync(n => n.ClientId == clientId && n.Id == noteId);
    }

    public async Task<FileNoteDocument?> GetDocumentAsync(Guid clientId, Guid noteId, Guid documentId)
    {
        var noteExistsForClient = await _context.FileNotes
            .AnyAsync(n => n.ClientId == clientId && n.Id == noteId);

        if (!noteExistsForClient) return null;

        return await _context.FileNoteDocuments
            .FirstOrDefaultAsync(d => d.FileNoteId == noteId && d.Id == documentId);
    }

    public async Task<FileNote> CreateNoteAsync(FileNote note, List<IFormFile>? files, Guid userId)
    {
        var documents = new List<FileNoteDocument>();

        if (files is { Count: > 0 })
        {
            foreach (var file in files)
            {
                var isPdf = string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase)
                            || file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

                if (!isPdf)
                {
                    _logger.LogWarning("Rejected non-PDF file upload for note {NoteId}: {FileName}", note.Id, file.FileName);
                    throw new InvalidOperationException($"Only PDF files are allowed. Invalid file: {file.FileName}");
                }

                await using var stream = file.OpenReadStream();
                var blobName = await _fileStorageService.UploadAsync(stream, file.FileName, "application/pdf");

                documents.Add(new FileNoteDocument
                {
                    FileName = file.FileName,
                    BlobName = blobName,
                    ContentType = "application/pdf",
                    FileSize = file.Length,
                    FileNoteId = note.Id,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        _context.FileNotes.Add(note);
        if (documents.Count > 0)
        {
            _context.FileNoteDocuments.AddRange(documents);
            note.Documents = documents;
        }

        await _context.SaveChangesAsync();
        return note;
    }

    public async Task<bool> UpdateNoteAsync(FileNote note, List<IFormFile>? files, Guid userId)
    {
        var existingNote = await _context.FileNotes
            .FirstOrDefaultAsync(n => n.ClientId == note.ClientId && n.Id == note.Id);

        if (existingNote == null) return false;

        // Copy updatable fields from incoming note DTO/model into the existing entity
        existingNote.Content = note.Content ?? existingNote.Content;
        existingNote.Title = note.Title ?? existingNote.Title;
        existingNote.Type = note.Type ?? existingNote.Type;
        existingNote.UpdatedById = note.UpdatedById;
        existingNote.UpdatedAt = DateTime.UtcNow;

        if (files is { Count: > 0 })
        {
            var newDocuments = new List<FileNoteDocument>();

            foreach (var file in files)
            {
                var isPdf = string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase)
                            || file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

                if (!isPdf)
                {
                    _logger.LogWarning("Rejected non-PDF file upload for note {NoteId}: {FileName}", existingNote.Id, file.FileName);
                    throw new InvalidOperationException($"Only PDF files are allowed. Invalid file: {file.FileName}");
                }

                await using var stream = file.OpenReadStream();
                var blobName = await _fileStorageService.UploadAsync(stream, file.FileName, "application/pdf");

                newDocuments.Add(new FileNoteDocument
                {
                    FileName = file.FileName,
                    BlobName = blobName,
                    ContentType = "application/pdf",
                    FileSize = file.Length,
                    FileNoteId = existingNote.Id,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            _context.FileNoteDocuments.AddRange(newDocuments);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNoteAsync(Guid clientId, Guid noteId)
    {
        var existingNote = await _context.FileNotes
            .FirstOrDefaultAsync(n => n.ClientId == clientId && n.Id == noteId);

        if (existingNote == null) return false;

        _context.FileNotes.Remove(existingNote);
        await _context.SaveChangesAsync();
        return true;
    }
    
}