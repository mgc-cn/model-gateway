import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.MG_B1_CLEAN_BASE_URL ?? "http://127.0.0.1:4334";
const evidenceDir = path.resolve(process.cwd(), "../../test-evidence/mg-b1-clean-runtime-20260716");

const readMasterKey = (): string => {
  if (process.env.LITELLM_MASTER_KEY) return process.env.LITELLM_MASTER_KEY;
  const workspaceEnv = fs.readFileSync(path.resolve(process.cwd(), "../../../../.env"), "utf8");
  const match = workspaceEnv.match(/^LITELLM_MASTER_KEY=(.+)$/m);
  if (!match) throw new Error("LITELLM_MASTER_KEY is not configured");
  return match[1].trim();
};

const englishLeaks = {
  root: ["Create New Key", "Reset Filters", "Showing 1", "Previous", "Created By", "Expires"],
  caching: ["Select Time Range", "Select range"],
  models: ["Current Team", "Personal", "Current Team Models", "Reset Filters", "No models found", "Switch off"],
  compare: ["Virtual Key Source", "Current UI Session", "Clear All Chats", "Add Comparison"],
  compliance: ["Test Configuration", "Quick Test", "Batch Results"],
  agent: ["Agent Builder", "Build Agents that pass your compliance requirements", "No agents yet"],
  publicSkills: ["Total Skills", "Namespaces", "Domains", "All Public Skills", "All Domains", "Skill Name"],
  onboarding: ["Failed to load invitation", "The invitation link may be invalid or expired.", "Back to Login"],
} as const;

test("CLEAN_RUNTIME renders MG-B1 routes from the current workspace", async ({ page, context }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await context.addCookies([{ name: "litellm_locale", value: "zh-CN", url: baseURL }]);

  await page.goto("/ui/login/");
  await page.locator('input[autocomplete="username"]').fill("admin");
  await page.locator('input[autocomplete="current-password"]').fill(readMasterKey());
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith("/ui") && !url.pathname.includes("login"));
  await expect(page.getByText("文档", { exact: true }).first()).toBeVisible();

  const results: Record<string, { url: string; lang: string | null; leaks: string[] }> = {};
  const capture = async (name: string, leaks: readonly string[]) => {
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(750);
    const text = await page.locator("body").innerText();
    results[name] = {
      url: page.url(),
      lang: await page.locator("html").getAttribute("lang"),
      leaks: leaks.filter((literal) => text.includes(literal)),
    };
    await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: true });
  };

  await page.goto("/ui/");
  await expect(page.getByText("新建密钥", { exact: false }).first()).toBeVisible();
  await capture("root-zh-CN", englishLeaks.root);

  await page.goto("/ui/?page=playground");
  await page.waitForURL((url) => url.pathname === "/ui/playground/" || url.pathname === "/ui/playground");
  await capture("legacy-playground-zh-CN", englishLeaks.compare);

  await page.goto("/ui/caching/");
  await page.getByText("缓存分析", { exact: true }).first().click();
  await capture("caching-zh-CN", englishLeaks.caching);

  await page.goto("/ui/models-and-endpoints/");
  const allModels = page.getByText("全部模型", { exact: true }).first();
  if (await allModels.isVisible().catch(() => false)) await allModels.click();
  await capture("models-zh-CN", englishLeaks.models);

  await page.goto("/ui/playground/");
  await page.getByText("模型对比", { exact: true }).first().click();
  await capture("playground-compare-zh-CN", englishLeaks.compare);
  await page.getByText("合规测试", { exact: true }).first().click();
  await capture("playground-compliance-zh-CN", englishLeaks.compliance);
  await page.getByText("智能体构建（实验功能）", { exact: true }).first().click();
  await capture("playground-agent-zh-CN", englishLeaks.agent);

  await page.goto("/ui/skills/");
  await expect(page.getByText("mg-b1-local-fixture", { exact: true }).first()).toBeVisible();
  await capture("skills-authenticated-zh-CN", []);

  await page.goto("/ui/model_hub/");
  const skillHubTab = page.getByText("技能中心", { exact: true }).first();
  if (await skillHubTab.isVisible().catch(() => false)) await skillHubTab.click();
  await expect(page.getByText("mg-b1-local-fixture", { exact: true }).first()).toBeVisible();
  await capture("skills-public-zh-CN", englishLeaks.publicSkills);

  await context.clearCookies({ name: "token" });
  await context.addCookies([{ name: "litellm_locale", value: "zh-CN", url: baseURL }]);
  await page.goto("/ui/onboarding/?invitation_id=mg-b1-invalid");
  await expect(page.getByText(/邀请|invitation/i).first()).toBeVisible();
  await capture("onboarding-invalid-zh-CN", englishLeaks.onboarding);

  fs.writeFileSync(path.join(evidenceDir, "clean-runtime-results.json"), `${JSON.stringify(results, null, 2)}\n`);

  expect(
    Object.entries(results).flatMap(([route, result]) => result.leaks.map((literal) => `${route}: ${literal}`)),
  ).toEqual([]);
  expect(results["legacy-playground-zh-CN"].url).toMatch(/\/ui\/playground\/?$/);
  for (const result of Object.values(results)) expect(result.lang).toBe("zh-CN");
});
