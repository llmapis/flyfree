import { CLAUDE_CODE, CODEX } from "../../constants/agents.js";
import type {
  BuiltinProvider,
  BuiltinProviderParams,
  BuiltinProviderResponse,
} from "../../types/builtin.js";
import { calculateObjectHash } from "../../utils/hash.js";
import { generateClaudeCodeConfig, generateCodexConfig } from "./tpl.js";

/**
 * Custom Provider
 *
 * 支持用户自定义配置任意 LLM Provider
 *
 * Usage: ff set <endpoint> <api-key> <model> -a <name>
 *
 * @example
 * ff set https://api.example.com/v1 sk-xxx claude-3-opus-20240229 -a my-custom
 */
export const customProvider: BuiltinProvider = {
  id: "custom",
  name: "Custom Provider",
  description: "User-defined custom provider",
  requiresApiKey: true,
  apiKeyParam: "key",

  handler: (params: BuiltinProviderParams): BuiltinProviderResponse => {
    const endpoint = params.params.get("endpoint");
    const apiKey = params.params.get("key");
    const model = params.params.get("model");

    if (!endpoint) {
      throw new Error(
        "Endpoint is required. Usage: ff set <endpoint> <api-key> <model> -a <name>"
      );
    }

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff set <endpoint> <api-key> <model> -a <name>"
      );
    }

    if (!model) {
      throw new Error(
        "Model is required. Usage: ff set <endpoint> <api-key> <model> -a <name>"
      );
    }

    // Normalize endpoint URL
    const normalizedEndpoint = endpoint.endsWith("/")
      ? endpoint.slice(0, -1)
      : endpoint;

    // Determine which agent to configure based on the agent parameter
    const providers = [];

    const claudeCodeSetting = generateClaudeCodeConfig(
      normalizedEndpoint,
      apiKey,
      model
    );

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    providers.push({
      name: CLAUDE_CODE,
      hash: claudeCodeHash,
      setting: claudeCodeSetting,
    });

    const codexSetting = generateCodexConfig(normalizedEndpoint, apiKey, model);

    const codexHash = calculateObjectHash(codexSetting);

    providers.push({
      name: CODEX,
      hash: codexHash,
      setting: codexSetting,
    });

    const response: BuiltinProviderResponse = {
      name: customProvider.name,
      description: customProvider.description,
      payload: {
        providers: providers,
        functions: [],
      },
    };

    return response;
  },
};
