import { select } from "@inquirer/prompts";
import { Subscriber } from "../core/subscriber.js";
import { Logger } from "../utils/logger.js";
import { CLAUDE_CODE, CODEX } from "../constants/agents.js";
import { AGENT_START_COMMAND } from "../constants/index.js";

/**
 * Set command options
 */
export interface SetCommandOptions {
  /** Custom provider alias (required for new signature) */
  alias?: string;
}

/**
 * Set command - configure custom provider with endpoint, api-key, and model
 *
 * New signature: ff set <endpoint> <api-key> <model> -a <name>
 *
 * @param endpoint - API endpoint URL
 * @param apiKey - API key for authentication
 * @param model - Model name to use
 * @param options - Command options
 */
export async function setCommand(
  endpoint: string,
  apiKey: string,
  model: string,
  options: SetCommandOptions
): Promise<void> {
  try {
    // Validate that alias is provided (required)
    if (!options.alias) {
      Logger.error(
        "Provider alias is required. Use -a <name> to specify a name for this configuration"
      );
      Logger.info("");
      Logger.info("Usage: ff set <endpoint> <api-key> <model> -a <name>");
      Logger.info("");
      Logger.info("Example:");
      Logger.info(
        "  ff set https://api.example.com/v1 sk-xxx claude-3-opus-20240229 -a my-custom"
      );
      Logger.info("");
      process.exit(1);
    }

    // Validate endpoint format
    if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
      Logger.error("Endpoint must start with http:// or https://");
      Logger.info("");
      process.exit(1);
    }

    Logger.info("");
    Logger.info(`Configuring custom provider...`);
    Logger.info(`Endpoint: ${endpoint}`);
    Logger.info(`Model: ${model}`);
    Logger.info(`Provider name: ${options.alias}`);
    Logger.info("");

    // Build the ff:// URL for the custom provider
    const params = new URLSearchParams();
    params.set("endpoint", endpoint);
    params.set("key", apiKey);
    params.set("model", model);

    const customUrl = `ff://custom?${params.toString()}`;

    // Use the Subscriber to subscribe to the custom provider
    // The -s parameter triggers interactive agent selection, but since we only have one agent
    // from the custom provider, it will auto-apply
    const subscribedAgents = await Subscriber.subscribe(
      customUrl,
      options.alias,
      false,
      true
    );

    Logger.info("");
    Logger.success(
      `Custom provider '${options.alias}' configured successfully!`
    );
    Logger.info("");
    Logger.info("You can now use:");
    subscribedAgents.forEach((v) => {
      Logger.info(
        `  ff ${AGENT_START_COMMAND[v]}        # To start vibe coding`
      );
    });

    Logger.info(
      `  ff unsub ${options.alias}            # Remove this provider`
    );
    Logger.info("");
  } catch (error) {
    Logger.error(
      `Set command failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    Logger.info("");
    process.exit(1);
  }
}
