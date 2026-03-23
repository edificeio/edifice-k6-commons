import http, {RefinedResponse} from "k6/http";
import { getHeaders } from "./user.utils";
import {UserbookSearchCriteria, UserPreferences} from "./models";
const rootUrl = __ENV.ROOT_URL;

export function getSearchCriteria(): UserbookSearchCriteria {
  let criteria = http.get(`${rootUrl}/userbook/search/criteria`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>criteria.body);
}

/**
 * Retrieve user preferences by the normalized API endpoint
 */
export function getUserPreferencesApi(): UserPreferences {
  let req = http.get(`${rootUrl}/userbook/api/preferences`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>req.body);
}

/**
 * Set homepage preferences by the normalized API endpoint
 * @param pref
 */
export function setUserPreferencesApi(pref: UserPreferences): RefinedResponse<any> {
  let resp = http.put(`${rootUrl}/userbook/api/preferences`,
      JSON.stringify(pref),
      { headers: getHeaders(), });
  return resp
}
