import type { TranslationKey } from "./translation-keys";

export class ApiError extends Error {
  constructor(
    public readonly errorCode: number,
    public readonly serverMessage: string,
    public readonly httpStatus: number,
  ) {
    super(serverMessage);
    this.name = "ApiError";
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return new ApiError(
      data.error_code ?? 0,
      data.message ?? response.statusText,
      response.status,
    );
  } catch {
    return new ApiError(0, response.statusText, response.status);
  }
}

export function getErrorTranslationKey(errorCode: number): TranslationKey | null {
  switch (errorCode) {
    case 1001: return "error_codes.invalid_settings_type";
    case 1002: return "error_codes.invalid_language_settings";
    case 1003: return "error_codes.invalid_reply_chance";
    case 1004: return "error_codes.invalid_release_notifications";
    case 1005: return "error_codes.invalid_media_mode";
    case 1006: return "error_codes.invalid_use_about_me";
    case 1007: return "error_codes.invalid_tool_choice";
    case 1008: return "error_codes.invalid_attachment_operation";
    case 1009: return "error_codes.missing_attachment_ids";
    case 1010: return "error_codes.malformed_attachment_id";
    case 1011: return "error_codes.invalid_image_format";
    case 1012: return "error_codes.invalid_image_size";
    case 1013: return "error_codes.missing_content";
    case 1014: return "error_codes.missing_filename";
    case 1015: return "error_codes.missing_url";
    case 1016: return "error_codes.missing_image_inputs";
    case 1017: return "error_codes.ambiguous_image_inputs";
    case 1018: return "error_codes.invalid_chat_type_token";
    case 1019: return "error_codes.invalid_platform";
    case 1020: return "error_codes.invalid_prompt_template";
    case 1021: return "error_codes.invalid_currency";
    case 1022: return "error_codes.invalid_limit";
    case 1023: return "error_codes.missing_image_attachment";
    case 1024: return "error_codes.license_refunded";
    case 1025: return "error_codes.license_from_test_order";
    case 1026: return "error_codes.license_from_preorder";
    case 1027: return "error_codes.license_already_bound";
    case 1028: return "error_codes.unsupported_currency_pair";
    case 1029: return "error_codes.malformed_user_id";
    case 1030: return "error_codes.malformed_chat_id";
    case 2001: return "error_codes.user_not_found";
    case 2002: return "error_codes.chat_not_found";
    case 2003: return "error_codes.attachment_not_found";
    case 2004: return "error_codes.license_key_not_found";
    case 2005: return "error_codes.chat_config_not_found";
    case 2006: return "error_codes.target_user_not_found";
    case 2007: return "error_codes.target_chat_not_found";
    case 2008: return "error_codes.exchange_rate_not_found";
    case 2009: return "error_codes.tool_not_found";
    case 2010: return "error_codes.token_not_found";
    case 2011: return "error_codes.unknown_command";
    case 2012: return "error_codes.no_authorized_chats";
    case 3001: return "error_codes.not_chat_admin";
    case 3002: return "error_codes.not_target_user";
    case 3003: return "error_codes.not_developer";
    case 3004: return "error_codes.no_private_chat";
    case 3005: return "error_codes.bot_cannot_set_alerts";
    case 3006: return "error_codes.unauthorized_seller";
    case 4001: return "error_codes.empty_token";
    case 4002: return "error_codes.no_user_id_in_token";
    case 5001: return "error_codes.image_generation_failed";
    case 5002: return "error_codes.web_fetch_failed";
    case 5003: return "error_codes.llm_unexpected_response";
    case 5004: return "error_codes.file_upload_failed";
    case 5005: return "error_codes.url_shortener_failed";
    case 5006: return "error_codes.attachment_processing_failed";
    case 5007: return "error_codes.web_search_failed";
    case 5008: return "error_codes.external_empty_response";
    case 5009: return "error_codes.image_edit_failed";
    case 5010: return "error_codes.document_search_failed";
    case 5011: return "error_codes.audio_transcription_failed";
    case 5012: return "error_codes.announcement_not_received";
    case 6001: return "error_codes.user_limit_reached";
    case 6002: return "error_codes.insufficient_credits";
    case 7001: return "error_codes.unsupported_chat_type";
    case 7002: return "error_codes.unsupported_provider";
    case 7003: return "error_codes.missing_chat_context";
    case 8001: return "error_codes.di_dependency_not_met";
    case 8003: return "error_codes.platform_mapping_failed";
    case 8004: return "error_codes.no_attachment_instance";
    case 8005: return "error_codes.missing_external_attachment_id";
    case 8006: return "error_codes.media_info_failed";
    case 8007: return "error_codes.media_download_failed";
    case 8008: return "error_codes.connect_key_update_failed";
    case 8009: return "error_codes.user_delete_failed";
    case 8010: return "error_codes.user_update_failed";
    case 8011: return "error_codes.sponsorship_operation_failed";
    case 8012: return "error_codes.unsponsor_self_failed";
    case 8013: return "error_codes.profile_connect_failed";
    case 8999: return "error_codes.unexpected_error";
    default: return null;
  }
}
