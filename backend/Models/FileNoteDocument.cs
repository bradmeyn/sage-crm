

using CrmApi.Models;

public class FileNoteDocument: BaseEntity
{
    public required string FileName { get; set; } 
    public required string BlobName { get; set; } 
    public required string ContentType { get; set; }
    public long FileSize { get; set; }
    public Guid FileNoteId {get; set;}
    public FileNote FileNote {get; set;} = null!;

}