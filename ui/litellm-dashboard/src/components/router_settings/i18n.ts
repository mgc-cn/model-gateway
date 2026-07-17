import type { TFunction } from "i18next";

const strategyKeys: Record<string, string> = {
  "simple-shuffle": "simpleShuffle",
  "least-busy": "leastBusy",
  "latency-based-routing": "latencyBased",
  "cost-based-routing": "costBased",
  "usage-based-routing": "usageBased",
  "usage-based-routing-v2": "usageBasedV2",
};

export const getStrategyLabel = (t: TFunction, strategy: string): string => {
  const key = strategyKeys[strategy];
  return key ? t(`routerSettings.strategies.${key}.label`) : strategy;
};

export const getStrategyDescription = (t: TFunction, strategy: string, fallback = ""): string => {
  const key = strategyKeys[strategy];
  return key ? t(`routerSettings.strategies.${key}.description`) : fallback;
};
