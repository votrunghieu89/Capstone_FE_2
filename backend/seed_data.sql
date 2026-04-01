-- 1. Làm sạch triệt để các bảng liên quan đến Thợ để nạp mới
DELETE FROM [Service_Profile];
DELETE FROM [TechnicianProfile];
DELETE FROM [ServiceCategories];
DELETE FROM [Cities];
DELETE FROM [Account] WHERE [Role] = 'Technician';

-- 2. Thêm 5 Thành phố lớn
DECLARE @dn UNIQUEIDENTIFIER = NEWID(); -- Đà Nẵng
DECLARE @hn UNIQUEIDENTIFIER = NEWID(); -- Hà Nội
DECLARE @hcm UNIQUEIDENTIFIER = NEWID(); -- TP. HCM
DECLARE @qn UNIQUEIDENTIFIER = NEWID(); -- Quảng Nam
DECLARE @hue UNIQUEIDENTIFIER = NEWID(); -- Thừa Thiên Huế

INSERT INTO [Cities] ([Id], [CityName]) VALUES (@dn, N'Đ' + NCHAR(224) + N' N' + NCHAR(7861) + N'ng');
INSERT INTO [Cities] ([Id], [CityName]) VALUES (@hn, N'H' + NCHAR(224) + N' N' + NCHAR(7897) + N'i');
INSERT INTO [Cities] ([Id], [CityName]) VALUES (@hcm, N'TP. H' + NCHAR(7891) + N' Ch' + NCHAR(237) + N' Minh');
INSERT INTO [Cities] ([Id], [CityName]) VALUES (@qn, N'Qu' + NCHAR(7843) + N'ng Nam');
INSERT INTO [Cities] ([Id], [CityName]) VALUES (@hue, N'Th' + NCHAR(7913) + N'a Thi' + NCHAR(230) + N'n Hu' + NCHAR(7871));

-- 3. Thêm 3 Loại dịch vụ phổ biến
DECLARE @s1 UNIQUEIDENTIFIER = NEWID(); -- Điều hòa
DECLARE @s2 UNIQUEIDENTIFIER = NEWID(); -- Tủ lạnh
DECLARE @s3 UNIQUEIDENTIFIER = NEWID(); -- Máy giặt

INSERT INTO [ServiceCategories] ([Id], [ServiceName], [Description], [CreateAt], [UpdateAt]) 
VALUES (@s1, N'S' + NCHAR(7917) + N'a ' + NCHAR(273) + N'i' + NCHAR(7873) + N'u h' + NCHAR(242) + N'a', N'AC Service', GETDATE(), GETDATE());
INSERT INTO [ServiceCategories] ([Id], [ServiceName], [Description], [CreateAt], [UpdateAt]) 
VALUES (@s2, N'S' + NCHAR(7917) + N'a t' + NCHAR(7911) + N' l' + NCHAR(7841) + N'nh', N'Fridge Service', GETDATE(), GETDATE());
INSERT INTO [ServiceCategories] ([Id], [ServiceName], [Description], [CreateAt], [UpdateAt]) 
VALUES (@s3, N'S' + NCHAR(7917) + N'a m' + NCHAR(225) + N'y gi' + NCHAR(7863) + N't', N'Washer Service', GETDATE(), GETDATE());

-- 4. Thêm 3 Kỹ thuật viên mẫu (Account + Profile)
-- Thợ A ở Đà Nẵng
DECLARE @t1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Account] ([Id], [Email], [PassWord], [Role], [IsActive], [IsOnline], [CreateAt], [UpdateAt]) 
VALUES (@t1, 'tech_a@fastfix.com', '123456', 'Technician', 1, 1, GETDATE(), GETDATE());
INSERT INTO [TechnicianProfile] ([Id], [FullName], [IdUnique], [PhoneNumber], [Address], [CityId], [Description], [Experiences], [OrderCount], [Latitude], [Longtitude], [AvatarURL], [CreateAt], [UpdateAt])
VALUES (@t1, N'Nguy' + NCHAR(7877) + N'n V' + NCHAR(259) + N'n A', 'TECH_001', '0905111222', N'Hải Châu, Đà Nẵng', @dn, N'Expert', N'10 years', 12, 16.0678, 108.2208, '', GETDATE(), GETDATE());

-- Thợ B ở Hà Nội
DECLARE @t2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Account] ([Id], [Email], [PassWord], [Role], [IsActive], [IsOnline], [CreateAt], [UpdateAt]) 
VALUES (@t2, 'tech_b@fastfix.com', '123456', 'Technician', 1, 1, GETDATE(), GETDATE());
INSERT INTO [TechnicianProfile] ([Id], [FullName], [IdUnique], [PhoneNumber], [Address], [CityId], [Description], [Experiences], [OrderCount], [Latitude], [Longtitude], [AvatarURL], [CreateAt], [UpdateAt])
VALUES (@t2, N'Tr' + NCHAR(7847) + N'n V' + NCHAR(259) + N'n B', 'TECH_002', '0905333444', N'Hoàn Kiếm, Hà Nội', @hn, N'Pro', N'8 years', 8, 21.0285, 105.8542, '', GETDATE(), GETDATE());

-- Thợ C ở TP. HCM
DECLARE @t3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO [Account] ([Id], [Email], [PassWord], [Role], [IsActive], [IsOnline], [CreateAt], [UpdateAt]) 
VALUES (@t3, 'tech_c@fastfix.com', '123456', 'Technician', 1, 1, GETDATE(), GETDATE());
INSERT INTO [TechnicianProfile] ([Id], [FullName], [IdUnique], [PhoneNumber], [Address], [CityId], [Description], [Experiences], [OrderCount], [Latitude], [Longtitude], [AvatarURL], [CreateAt], [UpdateAt])
VALUES (@t3, N'L' + NCHAR(234) + N' V' + NCHAR(259) + N'n C', 'TECH_003', '0905666777', N'Quận 1, TP. HCM', @hcm, N'Washer Expert', N'5 years', 24, 10.7769, 106.7009, '', GETDATE(), GETDATE());

-- 5. Link thợ với dịch vụ tương ứng
INSERT INTO [Service_Profile] ([Id], [ServiceId], [TechnicianId], [CreateAt], [UpdateAt]) VALUES (NEWID(), @s1, @t1, GETDATE(), GETDATE());
INSERT INTO [Service_Profile] ([Id], [ServiceId], [TechnicianId], [CreateAt], [UpdateAt]) VALUES (NEWID(), @s2, @t2, GETDATE(), GETDATE());
INSERT INTO [Service_Profile] ([Id], [ServiceId], [TechnicianId], [CreateAt], [UpdateAt]) VALUES (NEWID(), @s3, @t3, GETDATE(), GETDATE());
GO
