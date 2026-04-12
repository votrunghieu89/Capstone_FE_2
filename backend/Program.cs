using Capstone_2_BE;
using Capstone_2_BE.DALs;
using Capstone_2_BE.DALs.Admin;
using Capstone_2_BE.DALs.Customer;
using Capstone_2_BE.DALs.Technician;
using Capstone_2_BE.DTOs;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Repositories.Admin;
using Capstone_2_BE.Repositories.Administrator;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Repositories.Technician;
using Capstone_2_BE.Securities;
using Capstone_2_BE.Services;
using Capstone_2_BE.Services.Admin;
using Capstone_2_BE.Services.Customer;
using Capstone_2_BE.Services.Technician;
using Capstone_2_BE.Settings;
using Capstone_2_BE.Socket;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "Integration System API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid JWT token prefixed with 'Bearer ' (e.g., 'Bearer eyJhbGciOi...')",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

builder.Services.AddSignalR();
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, QueryStringUserIdProvider>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/NotificationHub") || path.StartsWithSegments("/ChatHub")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Configure Redis
var redisSettings = new RedisSetting();
builder.Configuration.GetSection("Redis").Bind(redisSettings);

var redisOptions = new ConfigurationOptions
{
    EndPoints = { $"{redisSettings.Host}:{redisSettings.Port}" },
    Password = string.IsNullOrEmpty(redisSettings.Password) ? null : redisSettings.Password,
    DefaultDatabase = redisSettings.DefaultDatabase,
    AbortOnConnectFail = false
};
var redisConnection = ConnectionMultiplexer.Connect(redisOptions);

// Register Redis connection as Singleton
builder.Services.AddSingleton<IConnectionMultiplexer>(redisConnection);

// Register Redis wrapper as Scoped
builder.Services.AddScoped<Redis>();

// Register repositories and services
builder.Services.AddScoped<IAuthenticationRepo, AuthenticationDAL>();
builder.Services.AddScoped<INotificationRepo, NotificationDAL>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<Googles>();
builder.Services.AddScoped<Token>();
builder.Services.AddScoped<Email>();

// Register Technician repositories and services
builder.Services.AddScoped<ITechnicianProfileRepo, TechnicianProfileDAL>();
builder.Services.AddScoped<TechnicianProfileService>();
builder.Services.AddScoped<ITechnicianRatingRepo, TechnicianRatingDAL>();
builder.Services.AddScoped<TechnicianRatingService>();
builder.Services.AddScoped<ITechnicianOrderRepo, TechnicianOrderDAL>();
builder.Services.AddScoped<TechnicianOrderService>();
builder.Services.AddScoped<ITechnicianStatisticRepo, TechnicianStatisticDAL>();
builder.Services.AddScoped<TechnicianStatisticService>();
// Register Customer repositories and services
builder.Services.AddScoped<ICustomerAutoFindRepo, CustomerAutoFindDAL>();
builder.Services.AddScoped<CustomerAutoFindService>();
builder.Services.AddScoped<ICustomerProfileRepo, CustomerProfileDAL>();
builder.Services.AddScoped<CustomerProfileService>();
builder.Services.AddScoped<ICustomerOrderRepo, CustomerOrderDAL>();
builder.Services.AddScoped<CustomerOrderService>();
builder.Services.AddScoped<ICustomerRatingRepo, CustomerRatingDAL>();
builder.Services.AddScoped<CustomerRatingService>();
builder.Services.AddScoped<ICityRepo, CityDAL>();
builder.Services.AddScoped<CityService>();
builder.Services.AddScoped<IChatRealTimeRepo, ChatRealTimeDAL>();
builder.Services.AddScoped<ChatRealTimeService>();

// Register Customer ViewAllTechnician DAL and Service
builder.Services.AddScoped<ICustomerViewAllTechnicianRepo, CustomerViewAllTechnicianDAL>();
builder.Services.AddScoped<CustomerViewAllTechnicianService>();

// Register AWS S3
builder.Services.AddScoped<AWS>();

// Register Google settings
builder.Services.Configure<GoogleSetting>(builder.Configuration.GetSection("GoogleAuth"));

// Register Service DAL and ServiceType
builder.Services.AddScoped<IServiceRepo, ServiceDAL>();
builder.Services.AddScoped<ServiceType>();

// Register NotificationService
builder.Services.AddScoped<NotificationService>();

builder.Services.AddScoped<IAdminRepo, AdminDAL>();
builder.Services.AddScoped<AdminService>();

// Seed 34 tỉnh/thành VN (idempotent)
using (var scope = builder.Services.BuildServiceProvider().CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.CanConnect())
    {
        var vnCities = new[]
        {
            "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Huế", "Cần Thơ", "Hải Phòng", "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng",
            "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng",
            "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La",
            "Tây Ninh", "Thái Nguyên", "Tuyên Quang", "Vĩnh Long"
        };

        var existing = db.CitiesModel.Select(c => c.CityName.Trim().ToLower()).ToHashSet();
        var toInsert = vnCities
            .Where(name => !existing.Contains(name.Trim().ToLower()))
            .Select(name => new Capstone_2_BE.Models.CitiesModel
            {
                Id = Guid.NewGuid(),
                CityName = name
            })
            .ToList();

        if (toInsert.Count > 0)
        {
            db.CitiesModel.AddRange(toInsert);
            db.SaveChanges();
        }

        // Seed nhiều đơn test In Progress để verify nút "Xác nhận hoàn thành" (idempotent)
        var testTitles = new[]
        {
            "__TEST_INPROGRESS_ORDER_1__",
            "__TEST_INPROGRESS_ORDER_2__",
            "__TEST_INPROGRESS_ORDER_3__"
        };

        var customerId = db.CustomerProfileModel.Select(c => c.Id).FirstOrDefault();
        var technicianId = db.TechnicianProfileModel.Select(t => t.Id).FirstOrDefault();
        var serviceId = db.ServiceCategoriesModel.Select(s => s.Id).FirstOrDefault();
        var cityId = db.CitiesModel.Select(c => c.Id).FirstOrDefault();

        if (customerId != Guid.Empty && technicianId != Guid.Empty && serviceId != Guid.Empty && cityId != Guid.Empty)
        {
            var existedTitles = db.OrderrModel
                .Where(o => testTitles.Contains(o.Title))
                .Select(o => o.Title)
                .ToHashSet();

            var now = DateTime.UtcNow;
            var newOrders = new List<Capstone_2_BE.Models.OrderrModel>();
            var newHistories = new List<Capstone_2_BE.Models.OrderStatusHistoryModel>();

            for (int i = 0; i < testTitles.Length; i++)
            {
                var title = testTitles[i];
                if (existedTitles.Contains(title)) continue;

                var orderId = Guid.NewGuid();
                var createAt = now.AddMinutes(-(i * 7));

                newOrders.Add(new Capstone_2_BE.Models.OrderrModel
                {
                    Id = orderId,
                    CustomerId = customerId,
                    TechnicianId = technicianId,
                    ServiceId = serviceId,
                    Title = title,
                    Description = "Đơn test để kiểm tra confirm-complete",
                    Address = "Địa chỉ test",
                    CityId = cityId,
                    Latitude = 16.047079m,
                    Longitude = 108.206230m,
                    Status = "In Progress",
                    CreateAt = createAt,
                    CompleteAt = createAt
                });

                newHistories.Add(new Capstone_2_BE.Models.OrderStatusHistoryModel
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    Status = "In Progress",
                    ChangeBy = customerId,
                    ChangeAt = createAt
                });
            }

            if (newOrders.Count > 0)
            {
                db.OrderrModel.AddRange(newOrders);
                db.OrderStatusHistoryModel.AddRange(newHistories);
                db.SaveChanges();
            }
        }
    }
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/NotificationHub");
app.MapHub<ChatHub>("/ChatHub");
app.Run();
