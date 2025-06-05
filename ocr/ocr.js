import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const langPath = path.resolve(__dirname, "../tessdata");

export async function extractTextFromImage(imagePath) {
  const processedImage = await preprocessImage(imagePath);
  const worker = await createWorker({
    langPath,
    logger: (m) => console.log("🧠 OCR 상태:", m),
  });

  try {
    console.log("📥 전처리 시작:", imagePath);
    console.log("✅ 전처리 완료:", imagePath);

    await worker.loadLanguage("kor+eng");
    await worker.initialize("kor+eng");

    const {
      data: { text },
    } = await worker.recognize(imagePath); // ⬅ 전처리된 이미지로 OCR

    console.log("📄 인식된 텍스트:\n", text);

    await worker.terminate();

    // 전처리 이미지 삭제
    fs.unlinkSync(imagePath);

    return text;
  } catch (error) {
    await worker.terminate();
    console.error("❌ OCR 실패:", error);
    throw error;
  }
}
async function preprocessImage(imagePath) {
  const ext = path.extname(imagePath) || ".png"; // 확장자 없으면 png 기본값
  console.log(`확장자: ${ext}`);

  const base = imagePath.replace(ext, ""); // 확장자 제거한 파일 이름
  const outputPath = `${base}-processed${ext}`; // 확장자 유지해서 새 이름 생성

  console.log(`outputPath: ${outputPath}`);

  try {
    console.log("🛠 sharp 전처리 시작...");
    // sharp 전처리
    await sharp(imagePath)
      .resize({ width: 1000, withoutEnlargement: true }) // 크기 확대
      .grayscale()
      .blur(1.2) // 노이즈 줄이기
      .modulate({
        brightness: 1.1,
        contrast: 1.2,
      })
      .threshold(130) // 이진화
      .toFile(outputPath);

    console.log("✅ sharp 전처리 완료:", outputPath);
  } catch (err) {
    console.error("❌ sharp 전처리 중 오류 발생:", err.message);
    console.error(err.stack); // 스택 트레이스를 출력하여 더 자세한 오류 추적
    throw err; // 예외를 던져서 호출한 함수에서 처리하도록 함
  }

  return outputPath;
}
