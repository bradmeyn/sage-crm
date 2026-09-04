using System.Text.Json.Serialization;

namespace CrmApi.DTOs.FileNote;

public class CreateFileNoteDto
{
    [JsonPropertyName("clientId")]
    public Guid ClientId { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
    
    // For file uploads
    [JsonPropertyName("files")]
    public List<IFormFile>? Files { get; set; }
}