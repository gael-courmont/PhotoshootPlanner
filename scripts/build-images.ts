// Turns the photographer's exports into the optimised assets the app serves.
// Reads photos/<spot-id>/* (about 2000 px on the long edge), writes a resized photo, a thumbnail
// and blur placeholder data per photo into public/spots/<spot-id>/, then updates that spot's
// photos in content/spots.json. Alt text is left for the photographer to write.
//   pnpm build-images [--photos <dir>] [--out <dir>] [--spots <file>]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  BLUR_LONG_EDGE,
  fitWithin,
  mergePhotos,
  photoPaths,
  SRC_LONG_EDGE,
  THUMB_LONG_EDGE,
  THUMB_MAX_BYTES,
} from "../lib/images";
import { spotSchema, type Spot } from "../lib/schemas";

const root = path.join(__dirname, "..");
const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? path.resolve(process.argv[i + 1]) : fallback;
};
const photosDir = arg("photos", path.join(root, "photos"));
const outDir = arg("out", path.join(root, "public", "spots"));
const spotsFile = arg("spots", path.join(root, "content", "spots.json"));

const IMAGE_FILE = /\.(jpe?g|png|webp|tiff?)$/i;

async function processPhoto(spotId: string, file: string): Promise<Spot["photos"][number]> {
  const { src, thumb } = photoPaths(spotId, path.basename(file));
  const input = sharp(file).rotate();
  const meta = await sharp(await input.clone().toBuffer()).metadata();
  const size = fitWithin(meta.width, meta.height, SRC_LONG_EDGE);
  const thumbSize = fitWithin(meta.width, meta.height, THUMB_LONG_EDGE);
  const blurSize = fitWithin(meta.width, meta.height, BLUR_LONG_EDGE);

  const publicFile = (url: string) => path.join(outDir, spotId, path.basename(url));
  await input.clone().resize(size.w, size.h).webp({ quality: 80 }).toFile(publicFile(src));
  const thumbBuffer = await input.clone().resize(thumbSize.w, thumbSize.h).webp({ quality: 70 }).toBuffer();
  if (thumbBuffer.length > THUMB_MAX_BYTES) throw new Error(`${file}: thumbnail is ${thumbBuffer.length} bytes`);
  writeFileSync(publicFile(thumb), thumbBuffer);
  const blur = await input.clone().resize(blurSize.w, blurSize.h).webp({ quality: 40 }).toBuffer();

  return {
    src,
    thumb,
    alt: { en: "", fr: "" },
    w: size.w,
    h: size.h,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

async function main() {
  const spots = z.array(spotSchema).parse(JSON.parse(readFileSync(spotsFile, "utf8")));
  const spotIds = new Set(spots.map((s) => s.id));
  const folders = readdirSync(photosDir, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const folder of folders) {
    const spot = spots.find((s) => s.id === folder.name);
    if (!spot) {
      console.warn(`skip ${folder.name}: no spot with this id (known: ${[...spotIds].join(", ")})`);
      continue;
    }
    const files = readdirSync(path.join(photosDir, folder.name))
      .filter((f) => IMAGE_FILE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    mkdirSync(path.join(outDir, spot.id), { recursive: true });
    const generated = [];
    for (const f of files) generated.push(await processPhoto(spot.id, path.join(photosDir, folder.name, f)));

    const merged = mergePhotos(spot.photos, generated);
    spotSchema.shape.photos.parse(merged); // 3 to 8 photos
    spot.photos = merged;
    console.log(`${spot.id}: ${merged.length} photos`);
  }

  writeFileSync(spotsFile, JSON.stringify(spots, null, 2) + "\n");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
