USE pillmate_db;

-- 테스트 유저 삽입
INSERT IGNORE INTO USER (user_id, name, password, age, gender)
VALUES (1, '테스트유저', '$2b$10$dummy_hashed_password', 25, '여성');

-- 테스트 알림 데이터 삽입
INSERT INTO NOTIFICATION (user_id, medicine_id, medicine_name, content, is_read, created_at) VALUES
(1, NULL, '타이레놀', '타이레놀이 만료되었습니다.', FALSE, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(1, NULL, 'ooo', 'ooo이 만료되었습니다.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, NULL, 'xxx', 'xxx이 만료되었습니다.', TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY));