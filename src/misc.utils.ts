import http, { RefinedResponse } from "k6/http";
import { getHeaders } from "./user.utils";
import { CLIENT_SCOPE, CLIENT_SECRET } from "./env.utils";
const rootUrl = __ENV.ROOT_URL;

export type OauthClientRegistrationRequest = {
  name: string;
  grantType?: string;
  code?: string;
  secret?: string;
  address?: string;
  scope?: string;
};

export function createOAuthClient(
  request: OauthClientRegistrationRequest,
  structureId?: string,
): RefinedResponse<undefined> {
  const res = http.post(
    `${rootUrl}/appregistry/application/external${structureId ? "?structureId=" + structureId : ""}`,
    JSON.stringify({
      ...request,
      grantType: request.grantType || "password",
      secret: request.secret || CLIENT_SECRET,
      address: request.address || "http://localhost:8090",
      scope: request.scope || CLIENT_SCOPE,
    }),
    {
      headers: { ...getHeaders(), "Content-Type": "application/json" },
    },
  );
  return res;
}
