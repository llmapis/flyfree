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
  return 'Validation errors:\n' + errors.map((err) => `  - ${err}`).join('\n');
}
