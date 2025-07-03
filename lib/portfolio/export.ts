export interface PortfolioExportData {
  text: string;
  images: string[];
  links: string[];
  layout: "grid" | "column";
  color: string;
}

export function generatePortfolioTemplates(data: PortfolioExportData): {
  html: string;
  css: string;
} {
  const bgClass = data.color || "bg-white";

  const textBlock = data.text
    ? `<div class="text-block flex flex-col max-h-[1000px] mb-1 mt-2 break-words">${data.text}</div>`
    : "";

  const images = data.images
    .map((src, idx) =>
      `<img src="${src}" class="object-cover  portfolio-img-frame ${idx === 0 ? "flex flex-col max-h-[3000px] mb-1 mt-2 break-words" : ""}" />`
    )
    .join("\n");

  const links = data.links
    .map(
      (href) =>
        `<a href="${href}" class="text-blue-500 underline break-all" target="_blank" rel="noreferrer">${href}</a>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio</title>
  <link href="tailwind.css" rel="stylesheet">
</head>
<body>
  <div class="portfolio-container flex flex-col w-[34rem] max-h-[3000px]">
    <div class="flex flex-col gap-2 rounded-lg p-4 ${bgClass} mt-4 max-h-[3000px]">
      ${textBlock}
      ${images}
      ${links}
    </div>
  </div>
</body>
</html>`;

  const css = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n.portfolio-container {\n  display: flex;\n  padding: 50px;\n  width: 34rem;\n}\n\n.portfolio-img-frame {\n  background: transparent;\n  border: 1px solid #1a192b;\n  padding: 0px;\n}\n\n.text-block {\n  width: fit-content;\n  border: .5px solid #000000;\n  border-radius: 2px;\n  font-size: .7rem;\n  line-height: 1;\n  letter-spacing: normal;\n  margin: 0.3rem 0;\n  padding: 0.3rem;\n  max-height: 9.25rem;\n  overflow-y: auto;\n  scroll-behavior: smooth;\n}`;

  return { html, css };
}
