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
  const layoutClass =
    data.layout === "grid" ? "grid grid-cols-3 gap-4" : "flex flex-col gap-4";
  const colorClass = data.color || "bg-white";

  const images = data.images
    .map((src) => `<img src="${src}" class="w-full" />`)
    .join("\n");
  const links = data.links
    .map(
      (href) =>
        `<a href="${href}" class="text-blue-500 underline" target="_blank" rel="noopener">${href}</a>`
    )
    .join("<br/>\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio</title>
  <link href="tailwind.css" rel="stylesheet">
</head>
<body class="${colorClass} p-4">
  <div class="${layoutClass}">
    <div>${data.text}</div>
    ${images}
    <div>${links}</div>
  </div>
</body>
</html>`;

  const css = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;

  return { html, css };
}
