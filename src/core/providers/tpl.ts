import { CLAUDE_CODE, CODEX, FFCodexEnvKey } from "../../constants/agents.js";
import type { AgentType } from "../../constants/index.js";
import { cleanConfigString } from "../../utils/hash.js";

export interface TemplateParams {
  endpoint: string;
  apiKey: string;
  model: string;
  [key: string]: string;
}

const CLAUDE_CODE_TPL = `
{
  "env": {
    "ANTHROPIC_BASE_URL": "\${endpoint}",
    "ANTHROPIC_AUTH_TOKEN": "\${apiKey}",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
    "ANTHROPIC_MODEL": "\${model}",
    "ANTHROPIC_SMALL_FAST_MODEL": "\${model}",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "\${model}",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "\${model}",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "\${model}"
  }
}
`;

const CODEX_TPL = `
[profiles.flyfree]
model_provider = "flyfree"
model = "\${model}"

[model_providers.flyfree]
name = "Custom Provider"
base_url = "\${endpoint}"
env_key = "${FFCodexEnvKey}"
wire_api = "chat"
requires_openai_auth = false
request_max_retries = 4
stream_max_retries = 10
stream_idle_timeout_ms = 300000
`;

/**
 * 模板映射表
 */
const TEMPLATE_MAP: Record<AgentType, string> = {
  [CLAUDE_CODE]: CLAUDE_CODE_TPL,
  [CODEX]: CODEX_TPL,
};

/**
 * 替换模板中的变量
 */
function replaceTemplateVars(template: string, params: TemplateParams): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * 根据 agent 类型生成配置
 * @param agentType - agent 类型
 * @param params - 模板参数（endpoint, apiKey 等）
 * @returns 生成的配置字符串
 */
export function generateConfig(
  agentType: AgentType,
  params: TemplateParams
): string {
  const template = TEMPLATE_MAP[agentType];
  if (!template) {
    throw new Error(`Unsupported agent type: ${agentType}`);
  }
  return replaceTemplateVars(template, params);
}

/**
 * 生成 Claude Code 配置
 * @param endpoint - API endpoint
 * @param apiKey - API key
 * @param model - 模型名称
 * @returns 生成的配置字符串
 */
export function generateClaudeCodeConfig(
  endpoint: string,
  apiKey: string,
  model: string
): string {
  return cleanConfigString(
    generateConfig(CLAUDE_CODE, { endpoint, apiKey, model })
  );
}

/**
 * 生成 Codex 配置
 * @param endpoint - API endpoint
 * @param apiKey - API key
 * @param model - 模型名称
 * @returns 生成的配置字符串
 */
export function generateCodexConfig(
  endpoint: string,
  apiKey: string,
  model: string
): string {
  return cleanConfigString(generateConfig(CODEX, { endpoint, apiKey, model }));
}
