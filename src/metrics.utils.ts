import http from "k6/http";
import { check } from "k6";
import { getHeaders } from "./user.utils.js";
import { BASE_URL } from "./env.utils.js";

export const getMetricValue = function (metricName: string) {
  const response = http.get(`${BASE_URL}/metrics`, {
    headers: getHeaders(),
  });
  check(response, {
    "should get an OK response": (r) => r.status == 200,
  });
  const lines = (<string>response.body)!.split("\n");
  for (let line of lines) {
    if (line.indexOf(`${metricName} `) === 0) {
      return parseFloat(line.substring(metricName.length + 1).trim());
    }
  }
  console.error("Metric", metricName, "not found");
  return null;
};
