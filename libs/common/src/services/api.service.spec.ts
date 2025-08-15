import { mock, MockProxy } from "jest-mock-extended";
import { of } from "rxjs";

// This import has been flagged as unallowed for this class. It may be involved in a circular dependency loop.
// eslint-disable-next-line no-restricted-imports
import { LogoutReason } from "@bitwarden/auth/common";

import { TokenService } from "../auth/abstractions/token.service";
import { DeviceType } from "../enums";
import { VaultTimeoutSettingsService } from "../key-management/vault-timeout";
import { ErrorResponse } from "../models/response/error.response";
import { AppIdService } from "../platform/abstractions/app-id.service";
import { Environment, EnvironmentService } from "../platform/abstractions/environment.service";
import { LogService } from "../platform/abstractions/log.service";
import { PlatformUtilsService } from "../platform/abstractions/platform-utils.service";

import { ApiService, HttpOperations } from "./api.service";

describe("ApiService", () => {
  let tokenService: MockProxy<TokenService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let environmentService: MockProxy<EnvironmentService>;
  let appIdService: MockProxy<AppIdService>;
  let refreshAccessTokenErrorCallback: jest.Mock<void, []>;
  let logService: MockProxy<LogService>;
  let logoutCallback: jest.Mock<Promise<void>, [reason: LogoutReason]>;
  let vaultTimeoutSettingsService: MockProxy<VaultTimeoutSettingsService>;
  let httpOperations: MockProxy<HttpOperations>;

  let sut: ApiService;

  beforeEach(() => {
    tokenService = mock();
    platformUtilsService = mock();
    platformUtilsService.getDevice.mockReturnValue(DeviceType.ChromeExtension);

    environmentService = mock();
    appIdService = mock();
    refreshAccessTokenErrorCallback = jest.fn();
    logService = mock();
    logoutCallback = jest.fn();
    vaultTimeoutSettingsService = mock();
    httpOperations = mock();

    sut = new ApiService(
      tokenService,
      platformUtilsService,
      environmentService,
      appIdService,
      refreshAccessTokenErrorCallback,
      logService,
      logoutCallback,
      vaultTimeoutSettingsService,
      httpOperations,
      "custom-user-agent",
    );
  });

  describe("send", () => {
    it("handles ok GET", async () => {
      environmentService.environment$ = of({
        getApiUrl: () => "https://example.com",
      } satisfies Partial<Environment> as Environment);

      httpOperations.createRequest.mockImplementation((url, request) => {
        return {
          url: url,
          cache: request.cache,
          credentials: request.credentials,
          method: request.method,
          mode: request.mode,
          signal: request.signal,
          headers: new Headers(request.headers),
        } satisfies Partial<Request> as unknown as Request;
      });

      tokenService.getAccessToken.mockResolvedValue("access_token");
      tokenService.tokenNeedsRefresh.mockResolvedValue(false);

      const nativeFetch = jest.fn<Promise<Response>, [request: Request]>();

      nativeFetch.mockImplementation((request) => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ hello: "world" }),
          headers: new Headers({
            "content-type": "application/json",
          }),
        } satisfies Partial<Response> as Response);
      });

      sut.nativeFetch = nativeFetch;

      const response = await sut.send("GET", "/something", null, true, true, null, null);

      expect(nativeFetch).toHaveBeenCalledTimes(1);
      const request = nativeFetch.mock.calls[0][0];
      // This should get set for users of send
      expect(request.cache).toBe("no-store");
      // TODO: Could expect on the credentials parameter
      expect(request.headers.get("Device-Type")).toBe("2"); // Chrome Extension
      // Custom user agent should get set
      expect(request.headers.get("User-Agent")).toBe("custom-user-agent");
      // This should be set when the caller has indicated there is a response
      expect(request.headers.get("Accept")).toBe("application/json");
      // If they have indicated that it's authed, then the authorization header should get set.
      expect(request.headers.get("Authorization")).toBe("Bearer access_token");
      // The response body
      expect(response).toEqual({ hello: "world" });
    });
  });

  const errorData: {
    name: string;
    input: Partial<Response>;
    error: Partial<ErrorResponse>;
  }[] = [
    {
      name: "json response in camel case",
      input: {
        json: () => Promise.resolve({ message: "Something bad happened." }),
        headers: new Headers({
          "content-type": "application/json",
        }),
      },
      error: {
        message: "Something bad happened.",
      },
    },
    {
      name: "json response in pascal case",
      input: {
        json: () => Promise.resolve({ Message: "Something bad happened." }),
        headers: new Headers({
          "content-type": "application/json",
        }),
      },
      error: {
        message: "Something bad happened.",
      },
    },
    {
      name: "json response with charset in content type",
      input: {
        json: () => Promise.resolve({ message: "Something bad happened." }),
        headers: new Headers({
          "content-type": "application/json; charset=utf-8",
        }),
      },
      error: {
        message: "Something bad happened.",
      },
    },
    {
      name: "text/plain response",
      input: {
        text: () => Promise.resolve("Something bad happened."),
        headers: new Headers({
          "content-type": "text/plain",
        }),
      },
      error: {
        message: "Something bad happened.",
      },
    },
  ];

  it.each(errorData)(
    "throws error-like response when not ok response with $name",
    async ({ input, error }) => {
      environmentService.environment$ = of({
        getApiUrl: () => "https://example.com",
      } satisfies Partial<Environment> as Environment);

      httpOperations.createRequest.mockImplementation((url, request) => {
        return {
          url: url,
          cache: request.cache,
          credentials: request.credentials,
          method: request.method,
          mode: request.mode,
          signal: request.signal,
          headers: new Headers(request.headers),
        } satisfies Partial<Request> as unknown as Request;
      });

      const nativeFetch = jest.fn<Promise<Response>, [request: Request]>();

      nativeFetch.mockImplementation((request) => {
        return Promise.resolve({
          ok: false,
          status: 400,
          ...input,
        } satisfies Partial<Response> as Response);
      });

      sut.nativeFetch = nativeFetch;

      await expect(
        async () => await sut.send("GET", "/something", null, true, true, null, null),
      ).rejects.toMatchObject(error);
    },
  );
});
