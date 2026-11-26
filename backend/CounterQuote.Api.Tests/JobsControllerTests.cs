using CounterQuote.Api.Controllers;
using CounterQuote.Api.Data;
using CounterQuote.Api.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CounterQuote.Api.Tests;

public class JobsControllerTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    public JobsControllerTests()
    {
        _connection.Open();
        using AppDbContext db = CreateDb();
        db.Database.Migrate();
    }

    public void Dispose() => _connection.Dispose();

    private AppDbContext CreateDb() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);

    [Fact]
    public async Task Created_job_can_be_read_back()
    {
        using (AppDbContext db = CreateDb())
            await new JobsController(db).Create(new Job { CustomerName = "Rivera", Material = "Quartz" });

        using AppDbContext readDb = CreateDb();
        Job job = Assert.Single(await new JobsController(readDb).GetAll());
        Assert.Equal("Rivera", job.CustomerName);
        Assert.Equal("Quartz", job.Material);
    }

    [Fact]
    public async Task Updating_a_job_saves_the_changes_and_keeps_its_created_date()
    {
        using AppDbContext db = CreateDb();
        db.Jobs.Add(new Job { CustomerName = "Rivera", Material = "Quartz", CreatedDate = new DateTime(2026, 1, 2) });
        db.SaveChanges();
        int id = db.Jobs.Single().Id;

        await new JobsController(db).Update(id, new Job { CustomerName = "Rivera", Material = "Marble" });

        using AppDbContext readDb = CreateDb();
        Job job = readDb.Jobs.Single();
        Assert.Equal("Marble", job.Material);
        Assert.Equal(new DateTime(2026, 1, 2), job.CreatedDate);
    }

    [Fact]
    public async Task Drawing_and_quote_total_are_saved()
    {
        using AppDbContext db = CreateDb();
        db.Jobs.Add(new Job { CustomerName = "Rivera", Material = "Quartz" });
        db.SaveChanges();
        int id = db.Jobs.Single().Id;
        const string drawing = """{"version":1,"counter":{"kind":"L"}}""";

        await new JobsController(db).Update(id, new Job { CustomerName = "Rivera", Material = "Quartz", Drawing = drawing, QuoteTotal = 4012.35m });

        using AppDbContext readDb = CreateDb();
        Job job = Assert.Single(await new JobsController(readDb).GetAll());
        Assert.Equal(drawing, job.Drawing);
        Assert.Equal(4012.35m, job.QuoteTotal);
    }

    [Fact]
    public async Task New_jobs_start_without_a_drawing()
    {
        using (AppDbContext db = CreateDb())
            await new JobsController(db).Create(new Job { CustomerName = "Rivera", Material = "Quartz" });

        using AppDbContext readDb = CreateDb();
        Job job = Assert.Single(await new JobsController(readDb).GetAll());
        Assert.Equal("", job.Drawing);
        Assert.Equal(0m, job.QuoteTotal);
    }
}
