import { CLAUDE_CODE } from "../../constants/agents.js";
import type {
  BuiltinProvider,
  BuiltinProviderParams,
} from "../../types/builtin.js";
import type { SubscribeResponse } from "../../types/provider.js";
import { calculateObjectHash, cleanConfigString } from "../../utils/hash.js";

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

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff sub ff://minimax?key=YOUR_API_KEY"
      );
    }

    // Claude Code 配置
    const claudeCodeSetting = cleanConfigString(`
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
    "ANTHROPIC_MODEL": "MiniMax-M2",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2"
  }
}
    `);

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    const response: SubscribeResponse = {
      name: miniMaxProvider.name,
      description: miniMaxProvider.description,
      payload: {
        providers: [
          {
            name: CLAUDE_CODE,
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
