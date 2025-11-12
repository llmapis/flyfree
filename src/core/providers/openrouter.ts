import type { BuiltinProvider, BuiltinProviderParams } from '../../types/builtin.js';
import type { SubscribeResponse } from '../../types/provider.js';
import { calculateObjectHash } from '../../utils/hash.js';

/**
 * OpenRouter Provider
 *
 * 支持通过 OpenRouter API 访问多种 LLM 模型
 *
 * @see https://openrouter.ai/
 */
export const openrouterProvider: BuiltinProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  description: 'OpenRouter API provider',
  requiresApiKey: true,
  apiKeyParam: 'key',

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get('key');

    if (!apiKey) {
      throw new Error('API key is required. Usage: ff sub ff://openrouter?key=YOUR_API_KEY');
    }

    const claudeCodeSetting = {
      anthropic: {
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      },
      modelName: 'anthropic/claude-3.5-sonnet',
    };

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    const response: SubscribeResponse = {
      name: openrouterProvider.name,
      description: openrouterProvider.description,
      payload: {
        providers: [
          {
            name: 'claude-code',
            hash: claudeCodeHash,
            setting: claudeCodeSetting,
          },
        ],
        functions: [],
      },
    };

    return response;
  },
};
