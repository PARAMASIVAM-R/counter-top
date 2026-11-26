using System.ComponentModel.DataAnnotations;

namespace CounterQuote.Api.Models;

public class Job
{
    public int Id { get; set; }

    [Required]
    public string CustomerName { get; set; } = "";

    public string Material { get; set; } = "";

    public DateTime CreatedDate { get; set; }

    /// <summary>The drawing and quote options as JSON, owned by the frontend. Empty until the job is first quoted.</summary>
    public string Drawing { get; set; } = "";

    /// <summary>The quoted price when the job was last saved, so the jobs list can show it without the pricing rules.</summary>
    public decimal QuoteTotal { get; set; }
}
