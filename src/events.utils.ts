import http, { RefinedResponse, ResponseType } from "k6/http";
import { getHeaders } from "./user.utils";
import { fail } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import {
  EventDTO,
} from "./models";

const rootUrl = __ENV.ROOT_URL;

export function getLastEvents(since: number, type: 'events' | 'traces' = 'events'): RefinedResponse<ResponseType | undefined> {
  let headers = getHeaders();
  return http.get(`${rootUrl}/infra/v2/event/list/${type}/${since}`, { headers });
}

export function getLastEventsOrFail(since: number, type: 'events' | 'traces' = 'events'): EventDTO[] {
  const res = getLastEvents(since, type);
  if (res.status !== 200) {
    fail(`Failed to get last events since ${since} of type ${type}`);
  }
  return JSON.parse(res.body as string) as EventDTO[];
}
