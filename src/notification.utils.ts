import http from "k6/http";
import { getHeaders } from "./user.utils.js";
import { Notification } from "./models";

const rootUrl = __ENV.ROOT_URL;

export function lastNotifications(): Notification[] | null {
  const headers = getHeaders();
  const res = http.get(`${rootUrl}/timeline/lastNotifications`, { headers });
  let notifications: Notification[] | null;
  if (res.status === 200) {
    notifications = JSON.parse(<string>res.body).results;
  } else {
    notifications = null;
  }
  return notifications;
}
