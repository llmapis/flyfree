import { CLAUDE_CODE } from "../../constants/agents.js";
import type {
  BuiltinProvider,
  BuiltinProviderParams,
  BuiltinProviderResponse,
} from "../../types/builtin.js";
import { calculateObjectHash, cleanConfigString } from "../../utils/hash.js";
import { generateClaudeCodeConfig } from "./tpl.js";

export const ZAI_DEFAULT_CLAUDE_ENDPOINT =
  "https://open.bigmodel.cn/api/anthropic";

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

  handler: (params: BuiltinProviderParams): BuiltinProviderResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error(
        "API key is required. Usage: ff sub ff://z.ai?key=YOUR_API_KEY"
      );
    }

    // Claude Code 配置
    const claudeCodeSetting = generateClaudeCodeConfig(
      ZAI_DEFAULT_CLAUDE_ENDPOINT,
      apiKey,
      "GLM-4.6"
    );

    const claudeCodeHash = calculateObjectHash(claudeCodeSetting);

    const response: BuiltinProviderResponse = {
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
