import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const font = readFileSync(fileURLToPath(new URL("./minecraft-seven.woff2", import.meta.url))).toString("base64");
const langs = [
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["python", "Python"],
  ["java", "Java"],
  ["html5", "HTML"],
  ["css3", "CSS"],
  ["json", "JSON"],
];
const base = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";
const icon = async (n) => {
  const res = await fetch(`${base}/${n}/${n}-original.svg`);
  if (!res.ok) throw new Error(`${n} ${res.status}`);
  const s = await res.text();
  const inner = s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vb = s.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 128 128";
  const ids = [...inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const fixed = ids.reduce((a, id) => a.replaceAll(`id="${id}"`, `id="${n}-${id}"`).replaceAll(`#${id})`, `#${n}-${id})`).replaceAll(`"#${id}"`, `"#${n}-${id}"`), inner);
  return [vb, fixed];
};

const H = 32, gap = 6, pad = 8, ic = 16;
let x = 2, body = "";
for (const [n, label] of langs) {
  const [vb, inner] = await icon(n);
  const w = pad + ic + 8 + Math.round(label.length * 7.2) + pad;
  body += `<g transform="translate(${x} 2)"><rect width="${w}" height="${H}" fill="#1e1e1f"/><rect x="1" y="1" width="${w - 2}" height="${H - 2}" fill="#313233"/><rect x="1" y="1" width="${w - 2}" height="1" fill="#48494a"/><rect x="1" y="${H - 2}" width="${w - 2}" height="1" fill="#242425"/><svg x="${pad}" y="${(H - ic) / 2}" width="${ic}" height="${ic}" viewBox="${vb}" shape-rendering="auto">${inner}</svg><text x="${pad + ic + 8}" y="21" fill="#ffffff">${label}</text></g>`;
  x += w + gap;
}
const W = x - gap + 2, Ht = H + 4;
writeFileSync("langs.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}">
<style>@font-face{font-family:"Minecraft Seven";src:url(data:font/woff2;base64,${font}) format("woff2")}text{font-family:"Minecraft Seven",monospace;font-size:12px}</style>
${body}
</svg>`);
console.log(`langs.svg ${W}x${Ht}`);
