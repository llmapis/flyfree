import Ajv from 'ajv';
import type { SubscribeResponse } from '../types/provider.js';
import { subscribeResponseSchema } from '../types/schemas.js';

/**
 * AJV 实例
 */
const ajv = new Ajv({ allErrors: true });

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误信息 */
  errors?: string[];
}

/**
 * 验证订阅响应数据
 */
export function validateSubscribeResponse(data: unknown): ValidationResult {
  const validate = ajv.compile(subscribeResponseSchema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map((err) => {
        const path = err.instancePath || 'root';
        return `${path}: ${err.message}`;
      }),
    };
  }

  return { valid: true };
}

/**
 * 类型守卫：检查数据是否为有效的 SubscribeResponse
 */
export function isSubscribeResponse(data: unknown): data is SubscribeResponse {
  const result = validateSubscribeResponse(data);
  return result.valid;
}

/**
 * 格式化验证错误信息
 */
export function formatValidationErrors(errors: string[]): string {
  const formattedErrors = errors.map((err) => {
    // 将 JSON Schema 路径转换为更友好的字段名
    let fieldPath = err;

    // 替换常见的路径为友好的字段名
    fieldPath = fieldPath.replace(/^\.?meta\./, 'meta.');
    fieldPath = fieldPath.replace(/^\.?data\./, 'data.');
    fieldPath = fieldPath.replace(/^\.?data\.payload\./, 'data.payload.');
    fieldPath = fieldPath.replace(/^\.?data\.payload\.providers\[\d+\]\./, 'data.payload.providers[].');

    // 处理根级别错误
    if (fieldPath.startsWith('root: ')) {
      fieldPath = fieldPath.replace('root: ', '');
    }

    // 美化错误消息，提供更详细的中文说明
    let errorMsg = fieldPath;

    // 必需字段错误
    if (errorMsg.includes("must have required property 'request_id'")) {
      errorMsg = errorMsg.replace("must have required property 'request_id'", "meta.request_id 字段缺失（请求唯一标识符）");
    } else if (errorMsg.includes("must have required property 'code'")) {
      errorMsg = errorMsg.replace("must have required property 'code'", "meta.code 字段缺失（错误码）");
    } else if (errorMsg.includes("must have required property 'message'")) {
      errorMsg = errorMsg.replace("must have required property 'message'", "meta.message 字段缺失（错误信息）");
    } else if (errorMsg.includes("must have required property 'name'")) {
      errorMsg = errorMsg.replace("must have required property 'name'", "name 字段缺失（供应商名称）");
    } else if (errorMsg.includes("must have required property 'hash'")) {
      errorMsg = errorMsg.replace("must have required property 'hash'", "hash 字段缺失（配置哈希值）");
    } else if (errorMsg.includes("must have required property 'setting'")) {
      errorMsg = errorMsg.replace("must have required property 'setting'", "setting 字段缺失（Agent 配置）");
    } else if (errorMsg.includes("must have required property 'providers'")) {
      errorMsg = errorMsg.replace("must have required property 'providers'", "providers 字段缺失（Agent 配置列表）");
    } else if (errorMsg.includes("must have required property 'payload'")) {
      errorMsg = errorMsg.replace("must have required property 'payload'", "payload 字段缺失（配置内容）");
    } else if (errorMsg.includes("must have required property 'functions'")) {
      errorMsg = errorMsg.replace("must have required property 'functions'", "functions 字段缺失（支持的功能列表）");
    }
    // 类型错误
    else if (errorMsg.includes('must be string')) {
      errorMsg = errorMsg.replace('must be string', '必须是字符串类型');
    } else if (errorMsg.includes('must be number')) {
      errorMsg = errorMsg.replace('must be number', '必须是数字类型');
    } else if (errorMsg.includes('must be object')) {
      errorMsg = errorMsg.replace('must be object', '必须是对象类型');
    } else if (errorMsg.includes('must be array')) {
      errorMsg = errorMsg.replace('must be array', '必须是数组类型');
    }
    // 长度错误
    else if (errorMsg.includes('must NOT have fewer than 1 characters')) {
      errorMsg = errorMsg.replace('must NOT have fewer than 1 characters', '不能为空字符串');
    } else if (errorMsg.includes('must NOT have fewer than 1 characters')) {
      errorMsg = errorMsg.replace('must NOT have fewer than 1 characters', '长度至少为1个字符');
    }
    // 特殊验证错误
    else if (errorMsg.includes('must NOT be valid')) {
      errorMsg = errorMsg.replace('must NOT be valid', '不能为 null（允许对象、数组、字符串、数字等非 null 值）');
    } else if (errorMsg.includes('must not have additional properties')) {
      errorMsg = errorMsg.replace('must not have additional properties', '包含不允许的额外属性');
    } else if (errorMsg.includes('must match format')) {
      errorMsg = errorMsg.replace('must match format', '格式不正确');
    }
    // 通用错误处理
    else if (errorMsg.includes('must have required property')) {
      errorMsg = errorMsg.replace('must have required property', '缺少必需字段');
    }

    return `  - ${errorMsg}`;
  });

  return `供应商响应格式验证失败:\n${formattedErrors.join('\n')}\n\n请参考 Flyfree 订阅协议规范: https://github.com/llmapis/flyfree/blob/main/docs/protocol/README.md`;
}
