import { mock, MockProxy } from "jest-mock-extended";

import { LogService } from "@bitwarden/logging";
import { AbstractStorageService } from "@bitwarden/storage-core";

import { currentVersion } from "./migrate";

describe("currentVersion", () => {
  let storage: MockProxy<AbstractStorageService>;
  let logService: MockProxy<LogService>;

  beforeEach(() => {
    storage = mock();
    logService = mock();
  });

  it("should return -1 if no version", async () => {
    storage.get.mockReturnValueOnce(null);
    expect(await currentVersion(storage, logService)).toEqual(-1);
  });

  it("should return version", async () => {
    storage.get.calledWith("stateVersion").mockReturnValueOnce(1 as any);
    expect(await currentVersion(storage, logService)).toEqual(1);
  });

  it("should return version from global", async () => {
    storage.get.calledWith("stateVersion").mockReturnValueOnce(null);
    storage.get.calledWith("global").mockReturnValueOnce({ stateVersion: 1 } as any);
    expect(await currentVersion(storage, logService)).toEqual(1);
  });

  it("should prefer root version to global", async () => {
    storage.get.calledWith("stateVersion").mockReturnValue(1 as any);
    storage.get.calledWith("global").mockReturnValue({ stateVersion: 2 } as any);
    expect(await currentVersion(storage, logService)).toEqual(1);
  });
});
