import type { FormItemProps } from "antd";
import i18n from "@/i18n/i18n";

export type CacheFieldType = "string" | "password" | "integer" | "float" | "boolean" | "list" | "model-select";

export type RedisType = "node" | "cluster" | "sentinel" | "semantic";

export type CacheSection = "connection" | "cluster" | "sentinel" | "semantic" | "ssl" | "cacheManagement" | "gcp";

export type CacheFieldRule = NonNullable<FormItemProps["rules"]>[number];

export interface CacheField {
  readonly name: string;
  readonly label: string;
  readonly type: CacheFieldType;
  readonly section: CacheSection;
  readonly helpText: string;
  readonly redisType: RedisType | null;
  readonly defaultValue?: string | number | boolean;
  readonly rules?: CacheFieldRule[];
}

export const REDIS_TYPES: readonly RedisType[] = ["node", "cluster", "sentinel", "semantic"];

export const REDIS_TYPE_DESCRIPTIONS: Readonly<Record<RedisType, string>> = {
  node: i18n.t("caching.settings.redisTypes.node.description"),
  cluster: i18n.t("caching.settings.redisTypes.cluster.description"),
  sentinel: i18n.t("caching.settings.redisTypes.sentinel.description"),
  semantic: i18n.t("caching.settings.redisTypes.semantic.description"),
};

const portRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return Promise.reject(new Error(i18n.t("caching.settings.validation.port")));
    }
    return Promise.resolve();
  },
};

const jsonListRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(value));
    } catch {
      return Promise.reject(new Error(i18n.t("caching.settings.validation.validJsonArray")));
    }
    if (!Array.isArray(parsed)) {
      return Promise.reject(new Error(i18n.t("caching.settings.validation.jsonArray")));
    }
    return Promise.resolve();
  },
};

const nonNegativeIntegerRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return Promise.reject(new Error(i18n.t("caching.settings.validation.nonNegativeInteger")));
    }
    return Promise.resolve();
  },
};

const numberRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    if (Number.isNaN(Number(value))) {
      return Promise.reject(new Error(i18n.t("caching.settings.validation.number")));
    }
    return Promise.resolve();
  },
};

export const CACHE_FIELDS: readonly CacheField[] = [
  {
    name: "url",
    label: i18n.t("caching.settings.fields.url.label"),
    type: "string",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.url.help"),
    redisType: null,
  },
  {
    name: "host",
    label: i18n.t("caching.settings.fields.host.label"),
    type: "string",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.host.help"),
    redisType: null,
  },
  {
    name: "port",
    label: i18n.t("caching.settings.fields.port.label"),
    type: "string",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.port.help"),
    redisType: null,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "db",
    label: i18n.t("caching.settings.fields.db.label"),
    type: "integer",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.db.help"),
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "password",
    label: i18n.t("caching.settings.fields.password.label"),
    type: "password",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.password.help"),
    redisType: null,
  },
  {
    name: "username",
    label: i18n.t("caching.settings.fields.username.label"),
    type: "string",
    section: "connection",
    helpText: i18n.t("caching.settings.fields.username.help"),
    redisType: null,
  },
  {
    name: "redis_startup_nodes",
    label: i18n.t("caching.settings.fields.redis_startup_nodes.label"),
    type: "list",
    section: "cluster",
    helpText: i18n.t("caching.settings.fields.redis_startup_nodes.help"),
    redisType: "cluster",
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    label: i18n.t("caching.settings.fields.sentinel_nodes.label"),
    type: "list",
    section: "sentinel",
    helpText: i18n.t("caching.settings.fields.sentinel_nodes.help"),
    redisType: "sentinel",
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    label: i18n.t("caching.settings.fields.service_name.label"),
    type: "string",
    section: "sentinel",
    helpText: i18n.t("caching.settings.fields.service_name.help"),
    redisType: "sentinel",
  },
  {
    name: "sentinel_password",
    label: i18n.t("caching.settings.fields.sentinel_password.label"),
    type: "password",
    section: "sentinel",
    helpText: i18n.t("caching.settings.fields.sentinel_password.help"),
    redisType: "sentinel",
  },
  {
    name: "similarity_threshold",
    label: i18n.t("caching.settings.fields.similarity_threshold.label"),
    type: "float",
    section: "semantic",
    helpText: i18n.t("caching.settings.fields.similarity_threshold.help"),
    redisType: "semantic",
    defaultValue: 0.8,
    rules: [numberRule],
  },
  {
    name: "redis_semantic_cache_embedding_model",
    label: i18n.t("caching.settings.fields.redis_semantic_cache_embedding_model.label"),
    type: "model-select",
    section: "semantic",
    helpText: i18n.t("caching.settings.fields.redis_semantic_cache_embedding_model.help"),
    redisType: "semantic",
  },
  {
    name: "ssl",
    label: i18n.t("caching.settings.fields.ssl.label"),
    type: "boolean",
    section: "ssl",
    helpText: i18n.t("caching.settings.fields.ssl.help"),
    redisType: null,
    defaultValue: false,
  },
  {
    name: "ssl_cert_reqs",
    label: i18n.t("caching.settings.fields.ssl_cert_reqs.label"),
    type: "string",
    section: "ssl",
    helpText: i18n.t("caching.settings.fields.ssl_cert_reqs.help"),
    redisType: null,
  },
  {
    name: "ssl_check_hostname",
    label: i18n.t("caching.settings.fields.ssl_check_hostname.label"),
    type: "boolean",
    section: "ssl",
    helpText: i18n.t("caching.settings.fields.ssl_check_hostname.help"),
    redisType: null,
    defaultValue: false,
  },
  {
    name: "namespace",
    label: i18n.t("caching.settings.fields.namespace.label"),
    type: "string",
    section: "cacheManagement",
    helpText: i18n.t("caching.settings.fields.namespace.help"),
    redisType: null,
  },
  {
    name: "ttl",
    label: i18n.t("caching.settings.fields.ttl.label"),
    type: "float",
    section: "cacheManagement",
    helpText: i18n.t("caching.settings.fields.ttl.help"),
    redisType: null,
    rules: [numberRule],
  },
  {
    name: "max_connections",
    label: i18n.t("caching.settings.fields.max_connections.label"),
    type: "integer",
    section: "cacheManagement",
    helpText: i18n.t("caching.settings.fields.max_connections.help"),
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "gcp_service_account",
    label: i18n.t("caching.settings.fields.gcp_service_account.label"),
    type: "string",
    section: "gcp",
    helpText: i18n.t("caching.settings.fields.gcp_service_account.help"),
    redisType: null,
  },
  {
    name: "gcp_ssl_ca_certs",
    label: i18n.t("caching.settings.fields.gcp_ssl_ca_certs.label"),
    type: "string",
    section: "gcp",
    helpText: i18n.t("caching.settings.fields.gcp_ssl_ca_certs.help"),
    redisType: null,
  },
];
