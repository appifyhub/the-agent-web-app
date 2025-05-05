export class Language {
  public readonly isoCode: string;
  public readonly defaultName: string;
  public readonly localizedName: string;
  public readonly flagEmoji: string;

  public constructor(
    isoCode: string,
    defaultName: string,
    localizedName: string,
    flagEmoji: string
  ) {
    this.isoCode = isoCode;
    this.defaultName = defaultName;
    this.localizedName = localizedName;
    this.flagEmoji = flagEmoji;
  }
}

export const LLM_LANGUAGES: Language[] = [
  {
    isoCode: "en",
    defaultName: "English",
    localizedName: "English",
    flagEmoji: "🇬🇧",
  },
  {
    isoCode: "rs",
    defaultName: "Serbian",
    localizedName: "Srpski",
    flagEmoji: "🇷🇸",
  },
  {
    isoCode: "al",
    defaultName: "Albanian",
    localizedName: "Shqip",
    flagEmoji: "🇦🇱",
  },
  {
    isoCode: "ar",
    defaultName: "Arabic",
    localizedName: "العربية",
    flagEmoji: "🇸🇦",
  },
  {
    isoCode: "hy",
    defaultName: "Armenian",
    localizedName: "Հայերեն",
    flagEmoji: "🇦🇲",
  },
  {
    isoCode: "az",
    defaultName: "Azerbaijani",
    localizedName: "Azərbaycan",
    flagEmoji: "🇦🇿",
  },
  {
    isoCode: "be",
    defaultName: "Belarusian",
    localizedName: "Беларуская",
    flagEmoji: "🇧🇾",
  },
  {
    isoCode: "bn",
    defaultName: "Bengali",
    localizedName: "বাংলা",
    flagEmoji: "🇧🇩",
  },
  {
    isoCode: "ba",
    defaultName: "Bosnian",
    localizedName: "Bosanski",
    flagEmoji: "🇧🇦",
  },
  {
    isoCode: "br",
    defaultName: "Brazilian Portuguese",
    localizedName: "Português do Brasil",
    flagEmoji: "🇧🇷",
  },
  {
    isoCode: "bg",
    defaultName: "Bulgarian",
    localizedName: "Български",
    flagEmoji: "🇧🇬",
  },
  {
    isoCode: "ca",
    defaultName: "Catalan",
    localizedName: "Català",
    flagEmoji: "🇦🇩",
  },
  {
    isoCode: "zh",
    defaultName: "Chinese",
    localizedName: "中文",
    flagEmoji: "🇨🇳",
  },
  {
    isoCode: "hr",
    defaultName: "Croatian",
    localizedName: "Hrvatski",
    flagEmoji: "🇭🇷",
  },
  {
    isoCode: "cs",
    defaultName: "Czech",
    localizedName: "Čeština",
    flagEmoji: "🇨🇿",
  },
  {
    isoCode: "da",
    defaultName: "Danish",
    localizedName: "Dansk",
    flagEmoji: "🇩🇰",
  },
  {
    isoCode: "nl",
    defaultName: "Dutch",
    localizedName: "Nederlands",
    flagEmoji: "🇳🇱",
  },
  {
    isoCode: "et",
    defaultName: "Estonian",
    localizedName: "Eesti",
    flagEmoji: "🇪🇪",
  },
  {
    isoCode: "fi",
    defaultName: "Finnish",
    localizedName: "Suomi",
    flagEmoji: "🇫🇮",
  },
  {
    isoCode: "fr",
    defaultName: "French",
    localizedName: "Français",
    flagEmoji: "🇫🇷",
  },
  {
    isoCode: "ka",
    defaultName: "Georgian",
    localizedName: "ქართული",
    flagEmoji: "🇬🇪",
  },
  {
    isoCode: "de",
    defaultName: "German",
    localizedName: "Deutsch",
    flagEmoji: "🇩🇪",
  },
  {
    isoCode: "el",
    defaultName: "Greek",
    localizedName: "Ελληνικά",
    flagEmoji: "🇬🇷",
  },
  {
    isoCode: "hi",
    defaultName: "Hindi",
    localizedName: "हिन्दी",
    flagEmoji: "🇮🇳",
  },
  {
    isoCode: "hu",
    defaultName: "Hungarian",
    localizedName: "Magyar",
    flagEmoji: "🇭🇺",
  },
  {
    isoCode: "id",
    defaultName: "Indonesian",
    localizedName: "Bahasa Indonesia",
    flagEmoji: "🇮🇩",
  },
  {
    isoCode: "ga",
    defaultName: "Irish",
    localizedName: "Gaeilge",
    flagEmoji: "🇮🇪",
  },
  {
    isoCode: "it",
    defaultName: "Italian",
    localizedName: "Italiano",
    flagEmoji: "🇮🇹",
  },
  {
    isoCode: "ja",
    defaultName: "Japanese",
    localizedName: "日本語",
    flagEmoji: "🇯🇵",
  },
  {
    isoCode: "kk",
    defaultName: "Kazakh",
    localizedName: "Қазақша",
    flagEmoji: "🇰🇿",
  },
  {
    isoCode: "ko",
    defaultName: "Korean",
    localizedName: "한국어",
    flagEmoji: "🇰🇷",
  },
  {
    isoCode: "ky",
    defaultName: "Kyrgyz",
    localizedName: "Кыргызча",
    flagEmoji: "🇰🇬",
  },
  {
    isoCode: "lv",
    defaultName: "Latvian",
    localizedName: "Latviešu",
    flagEmoji: "🇱🇻",
  },
  {
    isoCode: "lt",
    defaultName: "Lithuanian",
    localizedName: "Lietuvių",
    flagEmoji: "🇱🇹",
  },
  {
    isoCode: "mk",
    defaultName: "Macedonian",
    localizedName: "Македонски",
    flagEmoji: "🇲🇰",
  },
  {
    isoCode: "ms",
    defaultName: "Malay",
    localizedName: "Bahasa Melayu",
    flagEmoji: "🇲🇾",
  },
  {
    isoCode: "mt",
    defaultName: "Maltese",
    localizedName: "Malti",
    flagEmoji: "🇲🇹",
  },
  {
    isoCode: "md",
    defaultName: "Moldovan",
    localizedName: "Moldovenească",
    flagEmoji: "🇲🇩",
  },
  {
    isoCode: "mn",
    defaultName: "Mongolian",
    localizedName: "Монгол",
    flagEmoji: "🇲🇳",
  },
  {
    isoCode: "me",
    defaultName: "Montenegrin",
    localizedName: "Crnogorski",
    flagEmoji: "🇲🇪",
  },
  {
    isoCode: "ne",
    defaultName: "Nepali",
    localizedName: "नेपाली",
    flagEmoji: "🇳🇵",
  },
  {
    isoCode: "no",
    defaultName: "Norwegian",
    localizedName: "Norsk",
    flagEmoji: "🇳🇴",
  },
  {
    isoCode: "ps",
    defaultName: "Pashto",
    localizedName: "پښتو",
    flagEmoji: "🇦🇫",
  },
  {
    isoCode: "fa",
    defaultName: "Persian",
    localizedName: "فارسی",
    flagEmoji: "🇮🇷",
  },
  {
    isoCode: "pl",
    defaultName: "Polish",
    localizedName: "Polski",
    flagEmoji: "🇵🇱",
  },
  {
    isoCode: "pt",
    defaultName: "Portuguese",
    localizedName: "Português",
    flagEmoji: "🇵🇹",
  },
  {
    isoCode: "ro",
    defaultName: "Romanian",
    localizedName: "Română",
    flagEmoji: "🇷🇴",
  },
  {
    isoCode: "ru",
    defaultName: "Russian",
    localizedName: "Русский",
    flagEmoji: "🇷🇺",
  },
  {
    isoCode: "sd",
    defaultName: "Sindhi",
    localizedName: "سنڌي",
    flagEmoji: "🇵🇰",
  },
  {
    isoCode: "si",
    defaultName: "Sinhala",
    localizedName: "සිංහල",
    flagEmoji: "🇱🇰",
  },
  {
    isoCode: "sk",
    defaultName: "Slovak",
    localizedName: "Slovenčina",
    flagEmoji: "🇸🇰",
  },
  {
    isoCode: "sl",
    defaultName: "Slovenian",
    localizedName: "Slovenščina",
    flagEmoji: "🇸🇮",
  },
  {
    isoCode: "es",
    defaultName: "Spanish",
    localizedName: "Español",
    flagEmoji: "🇪🇸",
  },
  {
    isoCode: "uk",
    defaultName: "Ukrainian",
    localizedName: "Українська",
    flagEmoji: "🇺🇦",
  },
  {
    isoCode: "uz",
    defaultName: "Uzbek",
    localizedName: "O'zbek",
    flagEmoji: "🇺🇿",
  },
  {
    isoCode: "vi",
    defaultName: "Vietnamese",
    localizedName: "Tiếng Việt",
    flagEmoji: "🇻🇳",
  },
  {
    isoCode: "cy",
    defaultName: "Welsh",
    localizedName: "Cymraeg",
    flagEmoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  },
];

export const INTERFACE_LANGUAGES: Language[] = [
  {
    isoCode: "en",
    defaultName: "English",
    localizedName: "English",
    flagEmoji: "🇬🇧",
  },
  {
    isoCode: "rs",
    defaultName: "Serbian",
    localizedName: "Srpski",
    flagEmoji: "🇷🇸",
  },
  {
    isoCode: "ar",
    defaultName: "Arabic",
    localizedName: "العربية",
    flagEmoji: "🇸🇦",
  },
  {
    isoCode: "zh",
    defaultName: "Chinese",
    localizedName: "中文",
    flagEmoji: "🇨🇳",
  },
  {
    isoCode: "fr",
    defaultName: "French",
    localizedName: "Français",
    flagEmoji: "🇫🇷",
  },
  {
    isoCode: "de",
    defaultName: "German",
    localizedName: "Deutsch",
    flagEmoji: "🇩🇪",
  },
  {
    isoCode: "hi",
    defaultName: "Hindi",
    localizedName: "हिन्दी",
    flagEmoji: "🇮🇳",
  },
  {
    isoCode: "it",
    defaultName: "Italian",
    localizedName: "Italiano",
    flagEmoji: "🇮🇹",
  },
  {
    isoCode: "es",
    defaultName: "Spanish",
    localizedName: "Español",
    flagEmoji: "🇪🇸",
  },
];

export const DEFAULT_LANGUAGE: Language = INTERFACE_LANGUAGES[0];
