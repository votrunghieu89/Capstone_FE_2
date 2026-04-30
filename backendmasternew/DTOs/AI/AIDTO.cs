using System.ComponentModel.DataAnnotations;

public class ChatRequest
{
    [Required]
    public Guid AccountId { get; set; }

    public string Message { get; set; }
}