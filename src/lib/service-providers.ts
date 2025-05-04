export enum ServiceProviderType {
  LLM,
  AI_TOOLS,
  FINANCE,
  GENERAL_API,
}

export class ServiceProvider {
  id: string;
  name: string;
  type: ServiceProviderType;
  token_management_url: string;
  placeholder: string;
  tools: string;

  constructor(
    id: string,
    name: string,
    type: ServiceProviderType,
    token_management_url: string,
    placeholder: string,
    details: string
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.token_management_url = token_management_url;
    this.placeholder = placeholder;
    this.tools = details;
  }
}

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    id: "open-ai",
    name: "OpenAI",
    type: ServiceProviderType.AI_TOOLS,
    token_management_url: "https://platform.openai.com/api-keys",
    placeholder: "sk-...abc123",
    tools: "ChatGPT, DALL-E, Whisper, Image-1, …",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    type: ServiceProviderType.LLM,
    token_management_url: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...abc123",
    tools: "Claude, …",
  },
  {
    id: "rapid-api",
    name: "RapidAPI",
    type: ServiceProviderType.GENERAL_API,
    token_management_url:
      "https://docs.rapidapi.com/docs/configuring-api-security",
    placeholder: "abc...123",
    tools: "Search API, X (Twitter) API, Weather API, …",
  },
  {
    id: "coin-api",
    name: "CoinAPI",
    type: ServiceProviderType.FINANCE,
    token_management_url: "https://www.coinapi.io/products/exchange-rates-api",
    placeholder: "ABC...-...-...123",
    tools: "Crypto/Fiat API, Crypto List API, …",
  },
];
