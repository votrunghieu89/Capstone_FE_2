-- =============================================
-- FastFix - PostgreSQL Database Initialization
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUM Types
-- =============================================

CREATE TYPE user_role AS ENUM ('customer', 'technician', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'diagnosed', 'matched', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_status AS ENUM ('pending', 'held', 'released', 'refunded');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE media_type AS ENUM ('image', 'audio', 'video');

-- =============================================
-- TABLES
-- =============================================

-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories (Điện, Nước, HVAC, ...)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skills
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- 4. Technician Profiles
CREATE TABLE technician_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10, 2),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_jobs_completed INT DEFAULT 0,
    service_radius_km DECIMAL(5, 2) DEFAULT 10.00,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    last_location_update TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Technician Skills (Many-to-Many)
CREATE TABLE technician_skills (
    technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    PRIMARY KEY (technician_id, skill_id)
);

-- 6. Repair Requests
CREATE TABLE repair_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    urgency urgency_level NOT NULL DEFAULT 'medium',
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    ai_diagnosis TEXT,
    ai_estimated_cost DECIMAL(12, 2),
    ai_severity_score DECIMAL(3, 2),
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Request Media (ảnh, audio, video đính kèm)
CREATE TABLE request_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    media_type media_type NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    mongo_file_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES technician_profiles(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    status booking_status NOT NULL DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME NOT NULL,
    scheduled_time_end TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    quoted_price DECIMAL(12, 2),
    final_price DECIMAL(12, 2),
    technician_notes TEXT,
    customer_notes TEXT,
    checkin_photo_url TEXT,
    completion_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    technician_id UUID NOT NULL REFERENCES technician_profiles(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. E-Contracts
CREATE TABLE e_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    contract_content TEXT NOT NULL,
    customer_accepted BOOLEAN DEFAULT FALSE,
    technician_accepted BOOLEAN DEFAULT FALSE,
    customer_accepted_at TIMESTAMP WITH TIME ZONE,
    technician_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Payments (Escrow)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    held_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    notification_type VARCHAR(50),
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Chat Rooms
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    technician_id UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, technician_id, booking_id)
);

-- 14. Schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(technician_id, day_of_week)
);

-- =============================================
-- INDEXES (Performance)
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_technician_location ON technician_profiles(latitude, longitude);
CREATE INDEX idx_technician_available ON technician_profiles(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_repair_requests_customer ON repair_requests(customer_id);
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
CREATE INDEX idx_repair_requests_location ON repair_requests(latitude, longitude);
CREATE INDEX idx_bookings_technician ON bookings(technician_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_technician ON reviews(technician_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- =============================================
-- SEED DATA (Dữ liệu mẫu)
-- =============================================

-- Categories
INSERT INTO categories (name, description, icon_url) VALUES
('Điện', 'Sửa chữa hệ thống điện, ổ cắm, bóng đèn, tủ điện', '⚡'),
('Nước', 'Sửa chữa đường ống nước, vòi sen, bồn cầu, máy nước nóng', '🔧'),
('HVAC', 'Sửa chữa điều hòa, quạt, hệ thống thông gió', '❄️'),
('Sơn', 'Sơn tường, chống thấm, trát vá tường', '🎨'),
('Mộc', 'Sửa chữa đồ gỗ, cửa, tủ, kệ, sàn gỗ', '🪵'),
('Khóa', 'Sửa khóa, mở khóa, thay ổ khóa, khóa điện tử', '🔑'),
('Gia dụng', 'Sửa chữa thiết bị gia dụng: máy giặt, tủ lạnh, lò vi sóng', '🏠');

-- Skills
INSERT INTO skills (category_id, name) VALUES
(1, 'Sửa ổ cắm điện'), (1, 'Thay bóng đèn'), (1, 'Sửa tủ điện'),
(1, 'Đi dây điện mới'), (1, 'Sửa quạt trần'),
(2, 'Sửa ống nước rò rỉ'), (2, 'Thông tắc cống'), (2, 'Sửa vòi sen'),
(2, 'Sửa bồn cầu'), (2, 'Lắp máy nước nóng'),
(3, 'Vệ sinh điều hòa'), (3, 'Sửa điều hòa'), (3, 'Lắp điều hòa mới'),
(4, 'Sơn tường nội thất'), (4, 'Chống thấm'), (4, 'Trát vá tường'),
(5, 'Sửa cửa gỗ'), (5, 'Đóng tủ kệ'), (5, 'Sửa sàn gỗ'),
(6, 'Mở khóa'), (6, 'Thay ổ khóa'), (6, 'Lắp khóa điện tử'),
(7, 'Sửa máy giặt'), (7, 'Sửa tủ lạnh'), (7, 'Sửa lò vi sóng');

-- Admin Account (password: Admin@2026)
INSERT INTO users (email, password_hash, full_name, phone, role, is_active, is_verified) VALUES
('admin@fastfix.vn', crypt('Admin@2026', gen_salt('bf')), 'FastFix Admin', '0900000000', 'admin', TRUE, TRUE);

RAISE NOTICE 'FastFix database initialized successfully!';
