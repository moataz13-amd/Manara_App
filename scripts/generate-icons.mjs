import sharp from "sharp";

// Raster exports for launchers that do not support SVG app icons.
for (const size of [180, 192, 512]) {
  await sharp("public/images/Manara_App_Logo.svg", { density: 384 })
    .resize(size, size, { fit: "contain", background: "#ffffff" })
    .png()
    .toFile(`public/images/app-icon-${size}.png`);
}
