import type {
  SubscribeResponse,
  ProviderPayload,
  AgentProviderConfig,
} from "./provider.js";

/**
 * AgentProviderConfig 的 JSON Schema
 * 注意：由于 setting 是 unknown 类型，我们使用宽松的验证但不允许 null
 */
const agentProviderConfigSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    hash: { type: "string", minLength: 1 },
    setting: {
      not: { type: "null" }, // 不允许为 null，但允许其他任何类型
    },
  },
  required: ["name", "hash", "setting"],
  additionalProperties: false,
} as const;

/**
 * ProviderPayload 的 JSON Schema
 */
const providerPayloadSchema = {
  type: "object",
  properties: {
    providers: {
      type: "array",
      items: agentProviderConfigSchema,
      minItems: 1,
    },
    functions: {
      type: "array",
      items: {
        type: "string",
        enum: ["balance", "usage"],
      },
    },
  },
  required: ["providers"],
  additionalProperties: false,
} as const;

/**
 * SubscribeResponseMeta 的 JSON Schema
 */
const subscribeResponseMetaSchema = {
  type: "object",
  properties: {
    request_id: { type: "string", minLength: 1 },
    code: { type: "number" },
    message: { type: "string" },
  },
  required: ["request_id", "code", "message"],
  additionalProperties: false,
} as const;

/**
 * SubscribeResponseData 的 JSON Schema
 */
const subscribeResponseDataSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    payload: providerPayloadSchema,
  },
  required: ["name", "payload"],
  additionalProperties: false,
} as const;

/**
 * SubscribeResponse 的 JSON Schema
 * 用于验证订阅 URL 返回的数据格式
 */
export const subscribeResponseSchema = {
  type: "object",
  properties: {
    meta: subscribeResponseMetaSchema,
    data: subscribeResponseDataSchema,
  },
  required: ["meta", "data"],
  additionalProperties: false,
} as const;
