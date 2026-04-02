import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";

const rootUrl = __ENV.ROOT_URL;

export function getTimelineLastNotifications(
  types: string[] = [],
  page: number = 0,
): RefinedResponse<any> {
  const headers = getHeaders("application/json");
  const params = `page=${page}`;
  for (const type of types) {
    params.concat(`&type=${type}`);
  }
  let res = http.get(`${rootUrl}/timeline/lastNotifications?${params}`, {
    headers,
  });
  return res;
}

export type LastNotificationResults = {
  status: string;
  number: number;
  results: TimelineNotification[];
};

export type TimelineNotification = {
  _id: string;
  type: string;
  "event-type": string;
  params: Record<string, string>;
  date: { $date: string };
  message: string;
};
