import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import ts from "typescript";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const baselinePath = path.join(root, "scripts", "i18n-literal-baseline.json");
const writeBaseline = process.argv.includes("--write-baseline");

const visibleAttributes = new Set([
  "alt",
  "aria-label",
  "cancelText",
  "description",
  "label",
  "message",
  "notFoundContent",
  "okText",
  "placeholder",
  "title",
  "tooltip",
]);

const excludedPathPatterns = [
  /\/resources\//,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.stories\.[jt]sx?$/,
  /\/lib\/http\/schema\.d\.ts$/,
];

const reviewedTechnicalTerms = new Set([
  "API",
  "AWS",
  "GitHub",
  "HTTP",
  "JSON",
  "JWT",
  "LiteLLM",
  "MCP",
  "OAuth",
  "RPM",
  "SSO",
  "TPM",
]);

const normalize = (value) => value.replace(/\s+/g, " ").trim();

function isReviewedTechnicalLiteral(value) {
  if (reviewedTechnicalTerms.has(value)) return true;
  if (/^[A-Z][A-Z0-9_+./ -]*$/.test(value)) return true;
  if (/^(?:https?:\/\/|mailto:|\/|\.\/|\.\.\/)/.test(value)) return true;
  if (/^[\w.-]+@[\w.-]+$/.test(value)) return true;
  if (/^(?:[a-z][\w-]*\.)+[a-z][\w-]*$/i.test(value)) return true;
  if (/[{}]|=>|\$\{|^--|^NEXT_PUBLIC_|^LITELLM_/.test(value)) return true;
  return false;
}

function isCandidate(rawValue) {
  const value = normalize(rawValue);
  return value.length > 1 && /[A-Za-z]/.test(value) && !/^&[a-z]+;$/i.test(value) && !isReviewedTechnicalLiteral(value);
}

function isTranslationCall(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isCallExpression(current)) continue;
    const expression = current.expression;
    if (ts.isIdentifier(expression) && expression.text === "t") return true;
    if (
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === "i18n" &&
      expression.name.text === "t"
    ) {
      return true;
    }
  }
  return false;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function collectSourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolute));
    } else if (/\.[jt]sx?$/.test(entry.name) && !excludedPathPatterns.some((pattern) => pattern.test(absolute))) {
      files.push(absolute);
    }
  }
  return files.sort();
}

function scanFile(file) {
  const sourceText = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const relativePath = path.relative(root, file).split(path.sep).join("/");
  const findings = [];

  function add(node, kind, rawValue) {
    const text = normalize(rawValue);
    if (!isCandidate(text) || isTranslationCall(node)) return;
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({ fingerprint: `${relativePath}|${kind}|${text}`, path: relativePath, line: line + 1, kind, text });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      add(node, "jsx-text", node.getText(source));
    } else if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.getText(source))) {
      if (node.initializer && ts.isStringLiteral(node.initializer))
        add(node, `attribute:${node.name.text}`, node.initializer.text);
      if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const value = literalValue(node.initializer.expression);
        if (value !== null) add(node, `attribute:${node.name.text}`, value);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      const value = literalValue(node.initializer);
      if (name && visibleAttributes.has(name) && value !== null) add(node, `property:${name}`, value);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return findings;
}

const findings = collectSourceFiles(sourceRoot)
  .flatMap(scanFile)
  .filter(
    (finding, index, all) => all.findIndex((candidate) => candidate.fingerprint === finding.fingerprint) === index,
  )
  .sort((left, right) => left.fingerprint.localeCompare(right.fingerprint));

const summarizeByFile = (items) => {
  const grouped = new Map();
  for (const item of items) {
    const fingerprints = grouped.get(item.path) ?? [];
    fingerprints.push(item.fingerprint);
    grouped.set(item.path, fingerprints);
  }
  return Object.fromEntries(
    [...grouped.entries()].map(([file, fingerprints]) => [
      file,
      {
        count: fingerprints.length,
        digest: crypto.createHash("sha256").update(fingerprints.sort().join("\n")).digest("hex"),
      },
    ]),
  );
};

const currentSummary = summarizeByFile(findings);

if (writeBaseline) {
  fs.writeFileSync(baselinePath, `${JSON.stringify({ schemaVersion: 2, files: currentSummary }, null, 2)}\n`);
  console.log(`Updated i18n literal baseline with ${findings.length} finding(s).`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error("Missing scripts/i18n-literal-baseline.json. Run npm run i18n:scan:update after reviewing findings.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
if (baseline.schemaVersion !== 2 || !baseline.files || typeof baseline.files !== "object") {
  console.error("Invalid i18n literal baseline schema.");
  process.exit(1);
}

const regressions = Object.entries(currentSummary).filter(([file, current]) => {
  const approved = baseline.files[file];
  if (!approved) return true;
  if (current.count > approved.count) return true;
  return current.count === approved.count && current.digest !== approved.digest;
});
const removedCount = Object.entries(baseline.files).reduce(
  (total, [file, approved]) => total + Math.max(0, approved.count - (currentSummary[file]?.count ?? 0)),
  0,
);

if (regressions.length > 0) {
  console.error(`Found possible new user-visible English literals in ${regressions.length} file(s):`);
  for (const [file, current] of regressions.slice(0, 50)) {
    const approved = baseline.files[file];
    console.error(`- ${file}: current=${current.count}, baseline=${approved?.count ?? 0}`);
  }
  if (regressions.length > 50) console.error(`- ...and ${regressions.length - 50} more`);
  console.error("Translate the literals or document and implement a reviewed technical allowlist rule.");
  process.exit(1);
}

console.log(
  `i18n literal scan passed: ${findings.length} current finding(s), ${removedCount} removed since the reviewed baseline, 0 files regressed.`,
);
