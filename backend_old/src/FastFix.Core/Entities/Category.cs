namespace FastFix.Core.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
}

public class Skill
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category Category { get; set; } = null!;
    public ICollection<TechnicianSkill> TechnicianSkills { get; set; } = new List<TechnicianSkill>();
}

public class TechnicianSkill
{
    public Guid TechnicianId { get; set; }
    public int SkillId { get; set; }
    public int ProficiencyLevel { get; set; } = 1;

    public TechnicianProfile Technician { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
