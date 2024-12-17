import http from "k6/http";
import { getHeaders } from "./user.utils";
import { UserbookSearchCriteria } from "./models";
const rootUrl = __ENV.ROOT_URL;

export function getSearchCriteria(): UserbookSearchCriteria {
  let criteria = http.get(`${rootUrl}/userbook/search/criteria`, {
    headers: getHeaders(),
  });
  return JSON.parse(<string>criteria.body);
}
