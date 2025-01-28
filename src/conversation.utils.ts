import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";
import { DraftMessage } from "./models";

const rootUrl = __ENV.ROOT_URL;

/**
 * Create a draft message
 * @param message the draft message data
 * @returns the raw http response of draft message creation
 */
export function createDraftMessage(
  message: DraftMessage,
): RefinedResponse<any> {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  const payload = JSON.stringify(message);
  return http.post(`${rootUrl}/conversation/draft`, payload, { headers });
}

/**
 * Send a message
 * @param messageId the id of the message to be sent
 * @param message the message data (overwright the existing draft if existing) 
 * @returns the raw http response of the message sent
 */
export function sendMessage(
  messageId: string,
  message: DraftMessage,
): RefinedResponse<any> {
  const headers = getHeaders();
  headers["content-type"] = "application/json";
  const payload = JSON.stringify(message);
  return http.post(`${rootUrl}/conversation/send?id=${messageId}`, payload, {
    headers,
  });
}

/**
 * Fetch a message details by id
 * @param messageId the id of the message details to fetch
 * @param originalFormat whether the content of the message should be at the original format
 * (i.e. before content transformation)
 * @returns the message details
 */
export function getMessage(
  messageId: string,
  originalFormat: boolean,
): RefinedResponse<any> {
  const headers = getHeaders();
  return http.get(
    `${rootUrl}/conversation/api/messages/${messageId}?originalFormat=${originalFormat}`,
    {
      headers,
    },
  );
}
