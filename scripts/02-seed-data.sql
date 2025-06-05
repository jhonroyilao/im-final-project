-- Insert rooms S501-S509
INSERT INTO rooms (room_number, capacity, description) VALUES
('S501', 30, 'Computer Laboratory 1 - Programming Lab'),
('S502', 25, 'Computer Laboratory 2 - Network Lab'),
('S503', 35, 'Computer Laboratory 3 - Database Lab'),
('S504', 30, 'Computer Laboratory 4 - Web Development Lab'),
('S505', 28, 'Computer Laboratory 5 - Mobile Development Lab'),
('S506', 32, 'Computer Laboratory 6 - AI/ML Lab'),
('S507', 30, 'Computer Laboratory 7 - Cybersecurity Lab'),
('S508', 25, 'Computer Laboratory 8 - Software Engineering Lab'),
('S509', 40, 'Computer Laboratory 9 - Multimedia Lab');

-- Insert inventory items
INSERT INTO inventory_items (name, description, total_quantity, available_quantity, category) VALUES
('Desktop Computer', 'High-performance desktop computers', 100, 85, 'Hardware'),
('Laptop', 'Portable laptops for mobile computing', 50, 45, 'Hardware'),
('Projector', 'HD projectors for presentations', 15, 12, 'Audio/Visual'),
('Whiteboard Marker', 'Dry erase markers for whiteboards', 200, 180, 'Supplies'),
('HDMI Cable', 'HDMI cables for display connections', 30, 25, 'Cables'),
('Extension Cord', 'Power extension cords', 40, 35, 'Electrical'),
('Wireless Mouse', 'Wireless optical mouse', 80, 70, 'Peripherals'),
('Keyboard', 'Standard USB keyboards', 90, 80, 'Peripherals'),
('Webcam', 'HD webcams for video conferencing', 25, 20, 'Audio/Visual'),
('Microphone', 'USB microphones for audio recording', 20, 18, 'Audio/Visual'),
('Router', 'Wireless routers for network setup', 10, 8, 'Network'),
('Switch', 'Network switches', 15, 12, 'Network'),
('Arduino Kit', 'Arduino development kits', 30, 25, 'Development'),
('Raspberry Pi', 'Raspberry Pi single-board computers', 25, 20, 'Development'),
('VR Headset', 'Virtual Reality headsets', 8, 6, 'Emerging Tech');

-- Insert room equipment (pre-included equipment for each room)
-- Room S501 - Programming Lab
INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 30
FROM rooms r, inventory_items i
WHERE r.room_number = 'S501' AND i.name = 'Desktop Computer';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 1
FROM rooms r, inventory_items i
WHERE r.room_number = 'S501' AND i.name = 'Projector';

-- Room S502 - Network Lab
INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 25
FROM rooms r, inventory_items i
WHERE r.room_number = 'S502' AND i.name = 'Desktop Computer';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 2
FROM rooms r, inventory_items i
WHERE r.room_number = 'S502' AND i.name = 'Router';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 3
FROM rooms r, inventory_items i
WHERE r.room_number = 'S502' AND i.name = 'Switch';

-- Room S503 - Database Lab
INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 35
FROM rooms r, inventory_items i
WHERE r.room_number = 'S503' AND i.name = 'Desktop Computer';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 1
FROM rooms r, inventory_items i
WHERE r.room_number = 'S503' AND i.name = 'Projector';

-- Room S509 - Multimedia Lab
INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 40
FROM rooms r, inventory_items i
WHERE r.room_number = 'S509' AND i.name = 'Desktop Computer';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 2
FROM rooms r, inventory_items i
WHERE r.room_number = 'S509' AND i.name = 'Projector';

INSERT INTO room_equipment (room_id, item_id, quantity)
SELECT r.id, i.id, 10
FROM rooms r, inventory_items i
WHERE r.room_number = 'S509' AND i.name = 'Webcam';

-- Insert sample admin user
INSERT INTO users (email, password_hash, role) VALUES
('admin@ccis.edu', '$2a$10$example_hash', 'admin');

INSERT INTO admins (user_id, admin_id, first_name, surname)
SELECT u.id, 'ADMIN001', 'System', 'Administrator'
FROM users u WHERE u.email = 'admin@ccis.edu';

-- Insert sample scheduled classes
INSERT INTO scheduled_classes (room_id, class_name, instructor_name, day_of_week, time_start, time_end, semester, academic_year)
SELECT r.id, 'Programming Fundamentals', 'Prof. Smith', 1, '08:00', '10:00', 'First', '2024-2025'
FROM rooms r WHERE r.room_number = 'S501';

INSERT INTO scheduled_classes (room_id, class_name, instructor_name, day_of_week, time_start, time_end, semester, academic_year)
SELECT r.id, 'Database Systems', 'Prof. Johnson', 2, '10:00', '12:00', 'First', '2024-2025'
FROM rooms r WHERE r.room_number = 'S503';

INSERT INTO scheduled_classes (room_id, class_name, instructor_name, day_of_week, time_start, time_end, semester, academic_year)
SELECT r.id, 'Network Administration', 'Prof. Williams', 3, '14:00', '16:00', 'First', '2024-2025'
FROM rooms r WHERE r.room_number = 'S502';
