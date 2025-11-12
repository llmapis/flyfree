import type { SubscribeResponse, ProviderPayload, AgentProviderConfig } from './provider.js';

/**
 * AgentProviderConfig 的 JSON Schema
 * 注意：由于 setting 是 unknown 类型，我们使用宽松的验证
 */
const agentProviderConfigSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    hash: { type: 'string', minLength: 1 },
    setting: { nullable: false }, // unknown type, 允许任何值
  },
  required: ['name', 'hash', 'setting'],
  additionalProperties: false,
} as const;

/**
 * ProviderPayload 的 JSON Schema
 */
const providerPayloadSchema = {
  type: 'object',
  properties: {
    providers: {
      type: 'array',
      items: agentProviderConfigSchema,
      minItems: 1,
    },
    functions: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['balance', 'usage'],
      },
    },
  },
  required: ['providers', 'functions'],
  additionalProperties: false,
} as const;

/**
 * SubscribeResponse 的 JSON Schema
 * 用于验证订阅 URL 返回的数据格式
 */
export const subscribeResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    payload: providerPayloadSchema,
  },
  required: ['name', 'payload'],
  additionalProperties: false,
} as const;
