@echo off
SETLOCAL EnableDelayedExpansion

:menu
cls
echo ======================================================
echo           FASTFIX DOCKER MANAGER
echo ======================================================
echo.
echo  [Architecture]
echo    Docker: Frontend + Nginx + AI + Postgres + MongoDB
echo    Host:   Backend (dotnet run) + Redis 8.2 + SQL Server
echo.
echo ======================================================
echo.
echo  1.  [CORE]  Run Frontend + Nginx
echo              * Requires: BE running on host (dotnet run)
echo.
echo  2.  [AI]    Run AI Services (Postgres + MongoDB + AI)
echo              * Requires: Redis 8.2 running on host
echo.
echo  3.  [FULL]  Run Everything in Docker (FE + AI + Nginx)
echo              * Requires: BE + Redis + SQL Server on host
echo.
echo  4.  [DOWN]  Stop all FastFix Docker services
echo.
echo  5.  [BE]    Start Backend (dotnet run)
echo.
echo  6.  [PRUNE] Cleanup Docker (Volumes + Images)
echo.
echo  7.  Exit
echo.
echo ======================================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto run_core
if "%choice%"=="2" goto run_ai
if "%choice%"=="3" goto run_full
if "%choice%"=="4" goto docker_down
if "%choice%"=="5" goto run_backend
if "%choice%"=="6" goto docker_prune
if "%choice%"=="7" exit

:run_core
echo Starting Frontend + Nginx (Profile: core + proxy)...
docker compose --profile core --profile proxy up -d
pause
goto menu

:run_ai
echo Starting AI Services (Profile: ai)...
docker compose --profile ai up -d
pause
goto menu

:run_full
echo Starting All Docker Services (Profile: all)...
docker compose --profile all up -d
pause
goto menu

:docker_down
echo Stopping all Docker services...
docker compose --profile all down
pause
goto menu

:run_backend
echo Starting Backend (dotnet run)...
echo Make sure Redis 8.2 and SQL Server are running!
echo.
cd /d d:\FastFix\Capstone_BE_2
start dotnet run
echo Backend started in a new window.
pause
goto menu

:docker_prune
echo WARNING: This will delete volumes (database data).
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    docker compose --profile all down -v
    docker system prune -f
)
pause
goto menu
