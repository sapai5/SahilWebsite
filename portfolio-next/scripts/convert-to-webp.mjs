import sharp from "sharp";
import { readdirSync, unlinkSync } from "fs";
import { join, extname, basename } from "path";

const framesDir = new URL("../public/frames", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const files = readdirSync(framesDir).filter(f => extname(f).toLowerCase() === ".png");

console.log(`Converting ${files.length} PNGs to WebP...`);

let done = 0;
for (const file of files) {
    const src = join(framesDir, file);
    const dest = join(framesDir, basename(file, ".png") + ".webp");
    await sharp(src).webp({ quality: 82 }).toFile(dest);
    unlinkSync(src); // remove original PNG after conversion
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${files.length} done...`);
}

console.log(`✅ Done! All ${files.length} frames converted to WebP.`);
