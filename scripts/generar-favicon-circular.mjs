import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const SRC =
  process.argv[2] ??
  path.join(
    ROOT,
    "..",
    "..",
    "..",
    "Users",
    "alfon",
    ".cursor",
    "projects",
    "e-PAG-RAF-SECUNDARIAS-T-CNICAS-RAFleng",
    "assets",
    "c__Users_alfon_AppData_Roaming_Cursor_User_workspaceStorage_e0b4b5b7a1f50aeea957cd32827bbf97_images_Gemini_Generated_Image_7ovtcz7ovtcz7ovt_-_copia-1333fb66-2470-4019-a67d-ae96dc5ec23a.png"
  );

async function makeCircularIcon(input, outputSize, outputPath) {
  const meta = await sharp(input).metadata();
  const size = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - size) / 2);
  const top = Math.floor((meta.height - size) / 2);

  const cropped = await sharp(input)
    .extract({ left, top, width: size, height: size })
    .resize(outputSize, outputSize)
    .png()
    .toBuffer();

  const r = outputSize / 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
    </svg>`
  );

  await sharp(cropped).composite([{ input: mask, blend: "dest-in" }]).png().toFile(outputPath);
}

await makeCircularIcon(SRC, 192, path.join(ROOT, "public", "favicon.png"));
await makeCircularIcon(SRC, 180, path.join(ROOT, "public", "apple-icon.png"));
console.log("Favicons circulares generados.");
