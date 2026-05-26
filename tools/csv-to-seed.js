```js id="abm4qk"
// tools/csv-to-seed.js

const fs = require('fs');
const path = require('path');

const csvFile = process.argv[2];

if (!csvFile) {
  console.error('사용법: node tools/csv-to-seed.js 파일명.csv');
  process.exit(1);
}

const raw = fs.readFileSync(csvFile, 'utf-8');

const lines = raw
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

// 전국폐의약품수거함표준데이터 컬럼 순서 기준
const COL = {
  placeName: 0,
  sido: 1,
  sigungu: 2,
  roadAddress: 3,
  jibunAddress: 4,
  latitude: 5,
  longitude: 6,
  detailLocation: 7,
  managerName: 8,
  managerPhone: 9
};

console.log('헤더 확인:', lines[0]);

const rows = lines.slice(1);
const inserts = [];

rows.forEach((line, i) => {

  // 빈값(,,) 포함 CSV 안전 파싱
  const cols = [];
  let matches = line.match(/(".*?"|[^",]*)(?=,|$)/g);

  if (matches) {
    if (matches.length > 13) {
      matches = matches.slice(0, 13);
    }

    matches.forEach(m => cols.push(m));
  }

  const clean = cols.map(c =>
    c.replace(/^"|"$/g, '').trim()
  );

  const placeName      = clean[COL.placeName] || '';
  const sido           = clean[COL.sido] || '';
  const sigungu        = clean[COL.sigungu] || '';
  const roadAddress    = clean[COL.roadAddress] || '';
  const jibunAddress   = clean[COL.jibunAddress] || '';
  const latitude       = parseFloat(clean[COL.latitude]);
  const longitude      = parseFloat(clean[COL.longitude]);
  const detailLocation = clean[COL.detailLocation] || '';
  const managerName    = clean[COL.managerName] || '';
  const managerPhone   = clean[COL.managerPhone] || '';

  // 위경도 없는 데이터 제외
  if (!placeName || isNaN(latitude) || isNaN(longitude)) {
    console.warn(`[행 ${i + 2}] 스킵`);
    return;
  }

  // SQL 문자열 안전 처리
  const safe = (str) =>
    str.replace(/'/g, "\\'");

  inserts.push(`
(
  '${safe(placeName)}',
  '${safe(sido)}',
  '${safe(sigungu)}',
  '${safe(roadAddress)}',
  '${safe(jibunAddress)}',
  ${latitude},
  ${longitude},
  '${safe(detailLocation)}',
  '${safe(managerName)}',
  '${safe(managerPhone)}'
)
  `.trim());

});

const sql = `
USE pillmate_db;

TRUNCATE TABLE MEDICINE_WASTE_BIN;

INSERT INTO MEDICINE_WASTE_BIN
(
  place_name,
  sido,
  sigungu,
  road_address,
  jibun_address,
  latitude,
  longitude,
  detail_location,
  manager_name,
  manager_phone
)
VALUES

${inserts.join(',\n')};

SELECT COUNT(*) AS '삽입된 수거함 수'
FROM MEDICINE_WASTE_BIN;
`;

const outPath =
  path.join(__dirname, '../db/seed.sql');

fs.writeFileSync(outPath, sql, 'utf-8');

console.log(
  `✅ 완료: ${inserts.length}개 수거함 → db/seed.sql`
);
```
