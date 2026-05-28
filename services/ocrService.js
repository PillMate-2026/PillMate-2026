const vision = require('@google-cloud/vision');

/* =========================
   Vision Client 생성
========================= */

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'config/gcp-key.json'
});

/* =========================
   OCR 텍스트 추출
========================= */

const extractTextFromImage = async (imagePath) => {

  const [result] = await client.textDetection(imagePath);

  const detections = result.textAnnotations;

  if (!detections.length) {
    return '';
  }

  return detections[0].description;
};

module.exports = {
  extractTextFromImage
};