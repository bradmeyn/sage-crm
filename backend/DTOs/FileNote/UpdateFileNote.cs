using System.Text.Json.Serialization;

namespace CrmApi.DTOs.FileNote;

public class UpdateFileNoteDto
{

    [JsonPropertyName("id")]
    public Guid Id { get; set; }
    [JsonPropertyName("clientId")]
    public Guid ClientId { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("files")]
    public List<IFormFile>? Files { get; set; }
}