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
export const zaiProvider: BuiltinProvider = {
  id: "z.ai",
  name: "ZhiPu",
  description: "ZhiPu AI (智谱AI) built-in provider",
  requiresApiKey: true,
  apiKeyParam: "key",

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff sub ff://z.ai?key=YOUR_API_KEY"
      );
    }

    // Claude Code 配置
    const claudeCodeSetting = cleanConfigString(`
{
    "env": {
        "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
        "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
        "API_TIMEOUT_MS": "3000000",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1
    }
}
    `);

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    const response: SubscribeResponse = {
      name: zaiProvider.name,
      description: zaiProvider.description,
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
