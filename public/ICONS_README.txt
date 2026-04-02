ICONS REQUIRED — Chrome extensions do NOT support SVG icons.

You must place three PNG files in the /public/ folder:

  public/icon16.png   (16×16 px)
  public/icon48.png   (48×48 px)
  public/icon128.png  (128×128 px)

Quick way to create them:
  1. Open Figma / Canva or any image editor
  2. Create a 128×128 white square with rounded corners + the ⚡ emoji or your logo
  3. Export as PNG at 128×128, 48×48, 16×16

Or use ImageMagick (if installed):
  magick -size 128x128 xc:"#080808" -fill white -font Arial -pointsize 80 -gravity Center -annotate 0 "Z" icon128.png
  magick icon128.png -resize 48x48 icon48.png
  magick icon128.png -resize 16x16 icon16.png

Without PNG icons the extension will load but Chrome will show a grey puzzle piece icon.
