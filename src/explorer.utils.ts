import http, { RefinedResponse, ResponseType } from "k6/http";
import { getHeaders } from "./user.utils";
import { ExplorerRequestDTO, ExplorerResponseDTO } from "./models";
import { fail } from "k6";

const rootUrl = __ENV.ROOT_URL;

export const EXPLORER_WAIT_DELAY_AFTER_RESOURCE_CREATION = 3;

export function getExplorerResources(
  request: ExplorerRequestDTO,
): RefinedResponse<ResponseType | undefined> {
  const headers = getHeaders();
  // Transform request into query parameters and transform field names from camelCase to snake_case
  const queryParams: { [key: string]: string } = {};
  for (const key in request) {
    if (request[key as keyof ExplorerRequestDTO] !== undefined) {
      const snakeCaseKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      queryParams[snakeCaseKey] = String(
        request[key as keyof ExplorerRequestDTO],
      );
    }
  }
  const defaultParams = {
    start_idx: "0",
    page_size: "48",
    trashed: "false",
    order_by: "updatedAt:desc",
    folder: "default",
  };
  const finalQueryParams = { ...defaultParams, ...queryParams };
  return http.get(
    `${rootUrl}/explorer/resources?${new URLSearchParams(finalQueryParams)}`,
    { headers },
  );
}

export function getExplorerResourcesOrFail(
  request: ExplorerRequestDTO,
): ExplorerResponseDTO {
  const res = getExplorerResources(request);
  if (res.status !== 200) {
    fail(
      `Failed to get explorer resources for request: ${JSON.stringify(request)}`,
    );
  }
  return JSON.parse(res.body as string) as ExplorerResponseDTO;
}
