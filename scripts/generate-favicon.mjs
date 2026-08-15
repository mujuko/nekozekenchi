import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(rootDir, "public/favicon.svg");
const outputPath = resolve(rootDir, "public/favicon.ico");
const sizes = [16, 32, 48];

const source = await readFile(sourcePath);
const metadata = await sharp(source).metadata();

if (!metadata.width || metadata.width !== metadata.height) {
  throw new Error("public/favicon.svg must have a square canvas.");
}

const images = await Promise.all(
  sizes.map(async (size) => ({
    size,
    data: await sharp(source)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer(),
  })),
);

await writeFile(outputPath, createIco(images));
console.log(`Generated public/favicon.ico (${sizes.map((size) => `${size}x${size}`).join(", ")})`);

function createIco(images) {
  const directory = Buffer.alloc(6 + images.length * 16);
  directory.writeUInt16LE(0, 0); // Reserved
  directory.writeUInt16LE(1, 2); // ICO image
  directory.writeUInt16LE(images.length, 4);

  let imageOffset = directory.length;
  images.forEach(({ size, data }, index) => {
    const entryOffset = 6 + index * 16;
    const encodedSize = size === 256 ? 0 : size;

    directory.writeUInt8(encodedSize, entryOffset);
    directory.writeUInt8(encodedSize, entryOffset + 1);
    directory.writeUInt8(0, entryOffset + 2); // Color palette
    directory.writeUInt8(0, entryOffset + 3); // Reserved
    directory.writeUInt16LE(1, entryOffset + 4); // Color planes
    directory.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    directory.writeUInt32LE(data.length, entryOffset + 8);
    directory.writeUInt32LE(imageOffset, entryOffset + 12);

    imageOffset += data.length;
  });

  return Buffer.concat([directory, ...images.map(({ data }) => data)]);
}
