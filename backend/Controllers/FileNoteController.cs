using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CrmApi.DTOs.FileNote;
using CrmApi.Services;
using CrmApi.Models;

[Authorize]
[ApiController]
[Route("api/clients/{clientId}/notes")]  


public class FileNoteController : ControllerBase
{
    private readonly IFileNoteService _fileNoteService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<FileNoteController> _logger;

    private readonly ICurrentUserService _currentUserService;

    public FileNoteController(
        IFileNoteService fileNoteService,
         IFileStorageService fileStorageService,
         ICurrentUserService currentUserService,
         ILogger<FileNoteController> logger)
    {
        _fileNoteService = fileNoteService;
        _fileStorageService = fileStorageService;
        _currentUserService = currentUserService;
        _logger = logger;
    }
    [HttpGet]
    public async Task<IActionResult> GetNotes(Guid clientId)
    {
        var notes = await _fileNoteService.GetNotesAsync(clientId);
        return Ok(notes);
    }

    [HttpGet("{noteId}")]
    public async Task<IActionResult> GetNoteById(Guid clientid, Guid noteId)
    {
        var note = await _fileNoteService.GetNoteByIdAsync(clientid, noteId);
        return Ok(note);
    }

    [HttpGet("{noteId}/documents/{documentId}/download-url")]
    public async Task<IActionResult> GetDocumentDownloadUrl(Guid clientId, Guid noteId, Guid documentId)
    {
        var document = await _fileNoteService.GetDocumentAsync(clientId, noteId, documentId);
        if (document == null) return NotFound();

        var url = _fileStorageService.GetDownloadUrl(document.BlobName, TimeSpan.FromMinutes(15));
        return Ok(new { url });
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateNote(Guid clientId, [FromForm] CreateFileNoteDto data)
    {
        var userId = _currentUserService.UserId;
        var now = DateTime.UtcNow;
        
        var note = new FileNote
        {
            Title = data.Title,
            Content = data.Content,
            Type = data.Type,
            ClientId = clientId,
            CreatedById = userId,
            CreatedAt = now,
            UpdatedById = userId,
            UpdatedAt = now
        };

        var newNote = await _fileNoteService.CreateNoteAsync(note, data.Files, userId);
        return Ok(newNote);
    }

    [HttpPost("{noteId}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateNote(Guid clientId, Guid noteId, [FromForm] UpdateFileNoteDto data)
    {
        var userId = _currentUserService.UserId;

        var updatedNote = new FileNote
        {
            Id = noteId,
            Title = data.Title,
            Content = data.Content,
            Type = data.Type,
            ClientId = clientId,
            UpdatedById = userId,
            UpdatedAt = DateTime.UtcNow
        };

        var result = await _fileNoteService.UpdateNoteAsync(updatedNote, data.Files, userId);
        if (!result) return NotFound();
        return NoContent();
    }
}
