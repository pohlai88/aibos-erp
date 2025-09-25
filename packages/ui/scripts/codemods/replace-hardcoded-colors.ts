/**
 * Replace common Tailwind hardcoded palette classes with semantic tokens.
 * Heuristics-only; review diffs and adjust mapping to your brand/tokens.
 */
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";

type Mapping = { re: RegExp; replacement: string };

// Map color families → semantic token buckets
const TOKENS = {
  primary: ["blue", "indigo", "violet", "sky"],
  secondary: ["gray", "slate", "zinc", "neutral", "stone"],
  success: ["green", "emerald", "teal", "lime"],
  warning: ["yellow", "amber", "orange"],
  error: ["red", "rose"],
  info: ["cyan", "fuchsia", "purple", "pink"],
};

const SHADE = "(?:[1-9]00)"; // 100..900

function fam(families: string[], attrs: string[], token: string): Mapping[] {
  const famAlt = families.join("|");
  const at = attrs.join("|");
  return [
    { re: new RegExp(`\\b(?:${at})-(?:${famAlt})-${SHADE}\\b`, "g"), replacement: `${attrs[0]}-semantic-${token}` },
    // ring-offset special case
    ...(attrs.includes("ring") ? [{ re: new RegExp(`\\bring-offset-(?:${famAlt})-${SHADE}\\b`, "g"), replacement: "ring-offset-semantic-"+token }] : []),
  ];
}

const ATTRS = ["bg","text","border","ring"];
const MAPPINGS: Mapping[] = [
  ...fam(TOKENS.primary, ATTRS, "primary"),
  ...fam(TOKENS.secondary, ATTRS, "secondary"),
  ...fam(TOKENS.success, ATTRS, "success"),
  ...fam(TOKENS.warning, ATTRS, "warning"),
  ...fam(TOKENS.error, ATTRS, "error"),
  ...fam(TOKENS.info, ATTRS, "info"),
];

function dedupeSpaces(s: string) {
  return s.replace(/\s{2,}/g, " ");
}

async function run() {
  const globs = process.argv.slice(2);
  if (globs.length === 0) {
    console.error("Please pass one or more glob patterns, e.g.: apps/**/{*.tsx,*.ts} packages/**/{*.tsx,*.ts}");
    process.exit(1);
  }
  const entries = await fg(globs, { dot: false, absolute: true });
  let changed = 0;
  for (const file of entries) {
    if (fs.statSync(file).isDirectory()) continue;
    const src = fs.readFileSync(file, "utf8");
    let out = src;
    for (const { re, replacement } of MAPPINGS) {
      out = out.replace(re, (m) => {
        // Keep attribute prefix (bg/text/border/ring) if possible
        const attr = m.split("-")[0];
        return replacement.replace(ATTRS[0], attr);
      });
    }
    if (out !== src) {
      out = dedupeSpaces(out);
      fs.writeFileSync(file, out, "utf8");
      changed++;
      console.log("Updated:", path.relative(process.cwd(), file));
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
