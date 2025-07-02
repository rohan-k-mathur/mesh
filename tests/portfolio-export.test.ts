import { generatePortfolioTemplates } from "@/lib/portfolio/export";

test("portfolio export matches snapshot", () => {
  const data = {
    text: "Hello",
    images: ["img.png"],
    links: ["https://example.com"],
    layout: "column" as const,
    color: "bg-white",
  };

  const { html, css } = generatePortfolioTemplates(data);
  expect(html).toMatchSnapshot();
  expect(css).toMatchSnapshot();
});
