FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY FastFix.sln ./
COPY src/FastFix.Core/FastFix.Core.csproj src/FastFix.Core/
COPY src/FastFix.Application/FastFix.Application.csproj src/FastFix.Application/
COPY src/FastFix.Infrastructure/FastFix.Infrastructure.csproj src/FastFix.Infrastructure/
COPY src/FastFix.API/FastFix.API.csproj src/FastFix.API/

# Restore dependencies
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish src/FastFix.API/FastFix.API.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "FastFix.API.dll"]
