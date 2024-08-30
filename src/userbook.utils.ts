import http from "k6/http";
import { getHeaders } from "./user.utils";
import { Session, UserbookSearchCriteria } from "./models";
const rootUrl = __ENV.ROOT_URL;

export function getSearchCriteria(session: Session): UserbookSearchCriteria {
  let criteria = http.get(`${rootUrl}/userbook/search/criteria`, {
    headers: getHeaders(session),
  });
  return JSON.parse(<string>criteria.body);
}
