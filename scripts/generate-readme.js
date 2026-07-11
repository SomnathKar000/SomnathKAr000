const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const USERNAME = "SomnathKar000";
const DOB = new Date("2001-05-15"); // 👉 replace with your actual DOB
const IMAGE_PATH = "assets/profile.jpeg";
const ASCII_WIDTH = 40;

// ---- Uptime (age) ----
function getUptime(dob) {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} years, ${months} months, ${days} days`;
}

// ---- GitHub Stats ----
async function getGithubStats(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  const data = await res.json();
  return {
    repos: data.public_repos,
    followers: data.followers,
    following: data.following,
  };
}

// ---- ASCII Art (SVG tspans) ----
async function getAsciiTspans() {
  const { stdout } = await execPromise(
    `ascii-image-converter ${IMAGE_PATH} --width ${ASCII_WIDTH}`,
  );
  const lines = stdout.split("\n").filter((l) => l.trim().length > 0);

  let y = 20;
  const tspans = lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const tspan = `  <tspan x="15" y="${y}">${escaped}</tspan>`;
      y += 16;
      return tspan;
    })
    .join("\n");

  return { tspans, height: y + 20, lineCount: lines.length };
}

// ---- Build the SVG (viewBox so it scales to fit its column) ----
function buildSvg(tspans, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 ${height}" style="background:#0d1117">
<text x="15" y="20" fill="#c9d1d9" font-family="monospace" font-size="11" class="ascii">
${tspans}
</text>
</svg>`;
}

async function main() {
  const uptime = getUptime(DOB);
  const stats = await getGithubStats(USERNAME);
  const { tspans, height } = await getAsciiTspans();

  fs.writeFileSync("ascii-art.svg", buildSvg(tspans, height));

  const template = fs.readFileSync("README.template.md", "utf8");
  const output = template
    .replace(/{{UPTIME}}/g, uptime)
    .replace(/{{REPOS}}/g, stats.repos)
    .replace(/{{FOLLOWERS}}/g, stats.followers)
    .replace(/{{FOLLOWING}}/g, stats.following)
    .replace(/{{DATE}}/g, new Date().toISOString().split("T")[0]);

  fs.writeFileSync("README.md", output);
  console.log("README.md and ascii-art.svg generated ✅");
}

main().catch(console.error);
