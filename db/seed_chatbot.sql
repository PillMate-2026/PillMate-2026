USE pillmate_db;

-- =========================
-- SYMPTOM
-- =========================
INSERT IGNORE INTO SYMPTOM (name) VALUES
('두통'),
('발열'),
('근육통'),
('관절통'),
('치통'),
('생리통'),
('인후통'),
('콧물'),
('코막힘'),
('재채기'),
('기침'),
('가래'),
('알레르기'),
('비염'),
('소화불량'),
('속쓰림'),
('위산과다'),
('복통'),
('설사'),
('변비'),
('구역'),
('구토'),
('멀미'),
('복부팽만'),
('가스참'),
('피부가려움'),
('두드러기'),
('습진'),
('상처'),
('화상'),
('눈가려움'),
('충혈'),
('안구건조'),
('피로'),
('구내염');

-- =========================
-- INGREDIENT
-- =========================
INSERT IGNORE INTO INGREDIENT (name) VALUES
('아세트아미노펜'),
('이부프로펜'),
('덱시부프로펜'),
('나프록센'),
('아스피린'),
('클로르페니라민말레산염'),
('세티리진염산염'),
('로라타딘'),
('펙소페나딘염산염'),
('슈도에페드린염산염'),
('덱스트로메토르판브롬화수소산염수화물'),
('노스카핀'),
('구아이페네신'),
('아세틸시스테인'),
('암브록솔염산염'),
('트리메부틴말레산염'),
('돔페리돈'),
('메토클로프라미드염산염'),
('파모티딘'),
('라니티딘염산염'),
('알마게이트'),
('수산화마그네슘'),
('탄산칼슘'),
('시메티콘'),
('로페라미드염산염'),
('디옥타헤드랄스멕타이트'),
('락툴로오스농축액'),
('비사코딜'),
('메클리진염산염'),
('디멘히드리네이트'),
('히드로코르티손'),
('덱스판테놀'),
('포비돈요오드'),
('벤잘코늄염화물'),
('클로르헥시딘글루콘산염'),
('인공눈물'),
('나파졸린염산염'),
('토코페롤아세테이트'),
('푸르설티아민'),
('벤포티아민'),
('리보플라빈'),
('피리독신염산염'),
('시아노코발라민'),
('아스코르브산'),
('트리암시놀론아세토니드');

-- =========================
-- INGREDIENT_SYMPTOM
-- =========================

-- 해열/진통/소염
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('두통', '발열', '근육통', '관절통', '치통', '생리통', '인후통')
WHERE i.name IN ('아세트아미노펜', '이부프로펜');

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('두통', '발열', '근육통', '관절통', '치통', '생리통')
WHERE i.name IN ('덱시부프로펜');

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('두통', '근육통', '관절통', '치통', '생리통')
WHERE i.name IN ('나프록센', '아스피린');

-- 콧물/알레르기/비염
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('콧물', '재채기', '알레르기', '비염', '피부가려움', '두드러기')
WHERE i.name IN ('클로르페니라민말레산염', '세티리진염산염', '로라타딘', '펙소페나딘염산염');

-- 코막힘
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('코막힘', '비염')
WHERE i.name = '슈도에페드린염산염';

-- 기침
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('기침')
WHERE i.name IN ('덱스트로메토르판브롬화수소산염수화물', '노스카핀');

-- 가래
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('가래', '기침')
WHERE i.name IN ('구아이페네신', '아세틸시스테인', '암브록솔염산염');

-- 소화불량/복통/구역
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('소화불량', '복통', '구역', '구토', '복부팽만')
WHERE i.name IN ('트리메부틴말레산염');

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('구역', '구토', '소화불량')
WHERE i.name IN ('돔페리돈', '메토클로프라미드염산염');

-- 속쓰림/위산과다
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('속쓰림', '위산과다', '소화불량')
WHERE i.name IN ('파모티딘', '라니티딘염산염', '알마게이트', '수산화마그네슘', '탄산칼슘');

-- 가스/복부팽만
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('복부팽만', '가스참', '소화불량', '복통')
WHERE i.name = '시메티콘';

-- 설사
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('설사', '복통')
WHERE i.name IN ('로페라미드염산염', '디옥타헤드랄스멕타이트');

-- 변비
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('변비')
WHERE i.name IN ('락툴로오스농축액', '비사코딜', '수산화마그네슘');

-- 멀미
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('멀미', '구역', '구토')
WHERE i.name IN ('메클리진염산염', '디멘히드리네이트');

-- 피부/상처/화상
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('피부가려움', '두드러기', '습진')
WHERE i.name = '히드로코르티손';

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('상처', '화상')
WHERE i.name IN ('덱스판테놀');

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('상처')
WHERE i.name IN ('포비돈요오드', '벤잘코늄염화물', '클로르헥시딘글루콘산염');

-- 눈
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('안구건조')
WHERE i.name = '인공눈물';

INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('충혈', '눈가려움')
WHERE i.name = '나파졸린염산염';

-- 피로/비타민
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('피로', '근육통')
WHERE i.name IN ('토코페롤아세테이트', '푸르설티아민', '벤포티아민', '리보플라빈', '피리독신염산염', '시아노코발라민', '아스코르브산');

-- 구내염
INSERT IGNORE INTO INGREDIENT_SYMPTOM (ingredient_id, symptom_id)
SELECT i.ingredient_id, s.symptom_id
FROM INGREDIENT i
JOIN SYMPTOM s ON s.name IN ('구내염')
WHERE i.name IN ('트리암시놀론아세토니드', '리보플라빈');
