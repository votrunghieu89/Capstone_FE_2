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

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notification");
app.MapHub<ChatHub>("/hubs/chat");
app.Run();
