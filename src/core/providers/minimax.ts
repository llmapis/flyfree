import { CLAUDE_CODE, CODEX } from "../../constants/agents.js";
import type {
  BuiltinProvider,
  BuiltinProviderParams,
  BuiltinProviderResponse,
} from "../../types/builtin.js";
import { FFCodexEnvKey } from "../../constants/agents.js";
import { calculateObjectHash, cleanConfigString } from "../../utils/hash.js";
import { generateClaudeCodeConfig, generateCodexConfig } from "./tpl.js";

export const MINIMAX_DEFAULT_CLAUDE_ENDPOINT =
  "https://api.minimaxi.com/anthropic";

/**
 * Z.AI (智谱AI) Provider
 *
 * 支持通过智谱AI的 API 访问 Claude 和 GPT 模型
 *
 * @see https://open.bigmodel.cn/
 */
export const miniMaxProvider: BuiltinProvider = {
  id: "minimax",
  name: "MiniMax",
  description:
    "Building AGI with our mission Intelligence with Everyone. Global leader in multi-modal models and AI-native products with over 150 million users.",
  requiresApiKey: true,
  apiKeyParam: "key",

  handler: (params: BuiltinProviderParams): BuiltinProviderResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff sub ff://minimax?key=YOUR_API_KEY"
      );
    }

    const claudeCodeSetting = generateClaudeCodeConfig(
      MINIMAX_DEFAULT_CLAUDE_ENDPOINT,
      apiKey,
      "MiniMax-M2"
    );

    const codexSetting = generateCodexConfig(
      MINIMAX_DEFAULT_CLAUDE_ENDPOINT,
      apiKey,
      "MiniMax-M2"
    );

    const response: BuiltinProviderResponse = {
      name: miniMaxProvider.name,
      description: miniMaxProvider.description,
      payload: {
        providers: [
          {
            name: CLAUDE_CODE,
            hash: calculateObjectHash(claudeCodeSetting),
            setting: claudeCodeSetting,
          },
          {
            name: CODEX,
            hash: calculateObjectHash(claudeCodeSetting),
            setting: codexSetting,
            export_env: { [FFCodexEnvKey]: apiKey },
          },
        ],
        functions: [],
      },
    };

    return response;
  },
};
