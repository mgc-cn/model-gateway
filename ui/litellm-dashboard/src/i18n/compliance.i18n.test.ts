import { describe, expect, it } from "vitest";
import { getFrameworks } from "@/data/compliancePrompts";
import { en } from "./resources/en";
import { zhCN } from "./resources/zh-CN";

const datasetKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

describe("compliance dataset translations", () => {
  it("provides Chinese names for every built-in framework", () => {
    for (const framework of getFrameworks()) {
      const key = datasetKey(framework.name) as keyof typeof zhCN.playground.compliance.datasets.frameworks;
      expect(zhCN.playground.compliance.datasets.frameworks[key], framework.name).toBeTruthy();
      expect(zhCN.playground.compliance.datasets.frameworks[key]).not.toBe(framework.name);
    }
  });

  it("provides Chinese names for every built-in category", () => {
    for (const framework of getFrameworks()) {
      for (const category of framework.categories) {
        const key = datasetKey(category.name) as keyof typeof zhCN.playground.compliance.datasets.categories;
        expect(zhCN.playground.compliance.datasets.categories[key], category.name).toBeTruthy();
        expect(zhCN.playground.compliance.datasets.categories[key]).not.toBe(category.name);
      }
    }
  });

  it("keeps the English and Chinese dataset resource shapes aligned", () => {
    expect(Object.keys(zhCN.playground.compliance.datasets.frameworks)).toEqual(
      Object.keys(en.playground.compliance.datasets.frameworks),
    );
    expect(Object.keys(zhCN.playground.compliance.datasets.categories)).toEqual(
      Object.keys(en.playground.compliance.datasets.categories),
    );
    expect(Object.keys(zhCN.playground.compliance.datasets.descriptions)).toEqual(
      Object.keys(en.playground.compliance.datasets.descriptions),
    );
    expect(Object.keys(zhCN.playground.compliance.datasets.prompts)).toEqual(
      Object.keys(en.playground.compliance.datasets.prompts),
    );
  });

  it("provides Chinese display text for every EU AI Act and GDPR prompt", () => {
    const localizedFrameworks = new Set(["EU AI Act", "GDPR"]);
    for (const framework of getFrameworks().filter((item) => localizedFrameworks.has(item.name))) {
      for (const category of framework.categories) {
        for (const prompt of category.prompts) {
          const key = prompt.id as keyof typeof zhCN.playground.compliance.datasets.prompts;
          expect(zhCN.playground.compliance.datasets.prompts[key], prompt.id).toBeTruthy();
          expect(zhCN.playground.compliance.datasets.prompts[key]).not.toBe(prompt.prompt);
        }
      }
    }
  });
});
