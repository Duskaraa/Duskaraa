import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const font = readFileSync(fileURLToPath(new URL("./minecraft-seven.woff2", import.meta.url))).toString("base64");
const login = "Duskaraa";
const demo = process.argv.includes("--demo");
const out = process.argv.find((a) => a.endsWith(".svg")) ?? "contrib.svg";

const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}`;
const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const fake = () => {
  let s = 7;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const start = new Date(Date.UTC(2025, 10, 23));
  const weeks = [];
  let total = 0;
  for (let w = 0; w < 53; w++) {
    const contributionDays = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * 864e5);
      const busy = Math.sin(w / 5) * 0.3 + 0.5 + (d === 0 || d === 6 ? 0.15 : 0);
      const r = rnd();
      const n = r < 1 - busy ? 0 : Math.floor(rnd() * 20 * busy) + 1;
      total += n;
      contributionDays.push({ date: date.toISOString().slice(0, 10), weekday: d, level: n === 0 ? 0 : Math.min(4, 1 + Math.floor(n / 5)) });
    }
    weeks.push(contributionDays);
  }
  return { total, weeks };
};

const fetchReal = async () => {
  const token = process.env.CONTRIB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("set CONTRIB_TOKEN or GITHUB_TOKEN, or pass --demo");
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-readme" },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? res.status));
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, weekday: d.weekday, level: levels[d.contributionLevel] }))),
  };
};

const { total, weeks } = demo ? fake() : await fetchReal();

const colors = [
  ["#1e1e1f", "#141415", "#2a2a2b"],
  ["#1d4d13", "#173d0f", "#2a641c"],
  ["#2a641c", "#1d4d13", "#3c8527"],
  ["#3c8527", "#2a641c", "#55a63d"],
  ["#6cc349", "#3c8527", "#9ae07a"],
];
const T = 12, P = 15, padX = 20, labelW = 28, top = 30 + 14 + 22 + 6;
const gridW = weeks.length * P - (P - T);
const W = padX * 2 + labelW + gridW;
const H = top + 7 * P - (P - T) + 14 + 20 + 12;
const gx = padX + labelW, gy = top;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let g = "";
let lastMonth = -1, lastX = -99;
weeks.forEach((w, i) => {
  const first = w[0];
  const m = +first.date.slice(5, 7) - 1;
  const x = gx + i * P;
  if (m !== lastMonth && x - lastX >= 32) {
    g += `<text x="${x}" y="${gy - 8}" fill="#d0d1d4">${months[m]}</text>`;
    lastX = x;
  }
  lastMonth = m;
  w.forEach((d) => {
    const [f, lo, hi] = colors[d.level];
    const y = gy + d.weekday * P;
    g += `<rect x="${x}" y="${y}" width="${T}" height="${T}" fill="${lo}"/><rect x="${x}" y="${y}" width="${T}" height="${T - 1}" fill="${f}"/><rect x="${x}" y="${y}" width="${T}" height="1" fill="${hi}"/>`;
  });
});
"SMTWTFS".split("").forEach((c, i) => {
  g += `<text x="${padX + 4}" y="${gy + i * P + 10}" fill="#d0d1d4">${c}</text>`;
});

const legendY = gy + 7 * P - (P - T) + 14;
let legend = `<text x="${W - padX - 5 * P - 82}" y="${legendY + 10}" fill="#58585a">Less</text>`;
colors.forEach(([f, lo, hi], i) => {
  const x = W - padX - 5 * P - 46 + i * P;
  legend += `<rect x="${x}" y="${legendY}" width="${T}" height="${T}" fill="${lo}"/><rect x="${x}" y="${legendY}" width="${T}" height="${T - 1}" fill="${f}"/><rect x="${x}" y="${legendY}" width="${T}" height="1" fill="${hi}"/>`;
});
legend += `<text x="${W - padX}" y="${legendY + 10}" fill="#58585a" text-anchor="end">More</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
<style>@font-face{font-family:"Minecraft Seven";src:url(data:font/woff2;base64,${font}) format("woff2")}text{font-family:"Minecraft Seven",monospace;font-size:12px;text-rendering:optimizeSpeed}</style>
<rect width="${W}" height="${H}" fill="#1e1e1f"/>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="#313233"/>
<rect x="2" y="2" width="${W - 4}" height="1" fill="#48494a"/>
<rect x="2" y="2" width="1" height="${H - 4}" fill="#48494a"/>
<rect x="2" y="${H - 3}" width="${W - 4}" height="1" fill="#242425"/>
<rect x="${W - 3}" y="2" width="1" height="${H - 4}" fill="#242425"/>
<rect x="3" y="3" width="${W - 6}" height="30" fill="#48494a"/>
<rect x="3" y="3" width="${W - 6}" height="1" fill="#58585a"/>
<rect x="3" y="32" width="${W - 6}" height="1" fill="#1e1e1f"/>
<rect x="${padX}" y="12" width="12" height="12" fill="#3c8527"/><rect x="${padX}" y="12" width="12" height="2" fill="#6cc349"/><rect x="${padX}" y="22" width="12" height="2" fill="#1d4d13"/>
<text x="${padX + 22}" y="23" fill="#ffffff" style="font-size:16px">Contributions</text>
<text x="${W - padX}" y="23" fill="#d0d1d4" text-anchor="end">${total.toLocaleString("en-US")} in the last year</text>
<rect x="${gx - 4}" y="${gy - 4}" width="${gridW + 8}" height="${7 * P - (P - T) + 8}" fill="#1e1e1f" opacity="0"/>
${g}
${legend}
</svg>`;
writeFileSync(out, svg);
console.log(`${out} ${W}x${H} total=${total}`);
