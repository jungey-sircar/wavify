const sharp = require("sharp");
const fs = require("fs");

// tight bbox of the W + EKG tail + dot, drawn as pure white glyph
const GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 60 512 310">' +
  '<polyline points="84,150 158,320 232,192 306,320 380,164" fill="none" stroke="#FFFFFF" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<polyline points="382,168 404,214 426,150 452,256 470,192 480,192" fill="none" stroke="#FFFFFF" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="488" cy="192" r="11" fill="#FFFFFF"/>' +
  "</svg>";

async function padded1024(input, padTo = 620) {
  // fit glyph into `padTo` px, then pad to a clean 1024 canvas (adaptive safe zone)
  const w = 1024, h = 1024;
  const glyph = await sharp(input).resize(padTo, padTo, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function main() {
  const svg = fs.readFileSync("assets/logo.svg");

  // legacy full-square icon: whole logo tile
  await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile("assets/icon.png");

  // adaptive foreground: white glyph only, transparent bg, well inside the mask
  fs.writeFileSync("assets/_glyph.svg", GLYPH);
  const fg = await padded1024(fs.readFileSync("assets/_glyph.svg"), 620);
  await sharp(fg).toFile("assets/android-icon-foreground.png");

  // adaptive background: brand gradient
  const bg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#1D50FF"/><stop offset="1" stop-color="#0B38EF"/>' +
    "</linearGradient></defs><rect width=\"512\" height=\"512\" fill=\"url(#g)\"/></svg>";
  await sharp(Buffer.from(bg), { density: 384 }).resize(1024, 1024).png().toFile("assets/android-icon-background.png");

  // monochrome badge: same padded glyph
  const mono = await padded1024(fs.readFileSync("assets/_glyph.svg"), 620);
  await sharp(mono).toFile("assets/android-icon-monochrome.png");

  fs.unlinkSync("assets/_glyph.svg");

  for (const f of ["icon.png", "android-icon-foreground.png", "android-icon-background.png", "android-icon-monochrome.png"]) {
    const m = await sharp("assets/" + f).metadata();
    console.log(f, m.width + "x" + m.height);
  }
  console.log("ICONS OK");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
