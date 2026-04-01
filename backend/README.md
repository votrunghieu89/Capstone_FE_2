Lệnh tạo DB bằng migration
	+ Step 1: Mở terminal lên
	+ Step 2: dotnet ef migrations remove -- Xóa migration mới nhất
	+ Step 2: dotnet ef migrations add 'Tên migration'  -- Khởi tạo 1 migration
	+ Step 3: dotnet ef database update -- tạo 1 db dựa trên migration mới nhất



Cài RedisInsignt cho laptop - Cài Docker
Chạy Redis bằng Docker Config Redis with Docker: 
Step1: Dow Docker 
Step2: open Terminal with Admin: run -d --name redis -p 6379:6379 redis:8.2 
Step3: docker ps -> docker exec -it redis redis-cli -> PING ( nếu trả vể PONG là ok))	