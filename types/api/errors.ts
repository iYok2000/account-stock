/**
 * API error response body — backend returns { error?: string } on 4xx/5xx.
 */
export interface ApiErrorBody {
  error?: string;
}
