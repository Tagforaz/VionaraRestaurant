
using Microsoft.OpenApi.Models;
using Restaurant.API.Hubs;
using Restaurant.API.Middleware;
using Restaurant.Application;
using Restaurant.Infrastructure;
using Restaurant.Persistence;
using Restaurant.API.Hubs;
using Restaurant.Application.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opt =>
{
    opt.SwaggerDoc("v1", new OpenApiInfo { Title = "MyAPI", Version = "v1" });
    opt.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });

    opt.AddSecurityRequirement(new OpenApiSecurityRequirement
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


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:3000",    
                    "http://localhost:3001",      
                    "http://localhost:5173",     
                    "http://localhost:5174",     
                    "http://localhost:4200"      
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();  
        });
});

builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationService,Restaurant.API.Services.NotificationService>();
builder.Services
    .AddApplicationServices()
    .AddPersistenceServices(builder.Configuration)
    .AddInfrastructureServices(builder.Configuration);
    



var app = builder.Build();




// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    await app.UseAppDbContextInitializer(scope);
}

app.UseGlobalExceptionHandler();
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<CourierTrackingHub>("/hubs/courier-tracking");
app.MapHub<OrderStatusHub>("/hubs/order-status");

app.MapControllers();

app.Run();
