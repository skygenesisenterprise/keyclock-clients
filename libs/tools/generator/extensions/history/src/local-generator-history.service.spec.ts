import { mock } from "jest-mock-extended";
import { firstValueFrom, of } from "rxjs";

import { EncryptService } from "@bitwarden/common/key-management/crypto/abstractions/encrypt.service";
import { EncString } from "@bitwarden/common/key-management/crypto/models/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "@bitwarden/common/types/csprng";
import { UserId } from "@bitwarden/common/types/guid";
import { UserKey } from "@bitwarden/common/types/key";
import { Type } from "@bitwarden/generator-core";
import { KeyService } from "@bitwarden/key-management";

import { FakeStateProvider, awaitAsync, mockAccountServiceWith } from "../../../../../common/spec";

import { LocalGeneratorHistoryService } from "./local-generator-history.service";

const SomeUser = "SomeUser" as UserId;
const AnotherUser = "AnotherUser" as UserId;

describe("LocalGeneratorHistoryService", () => {
  const encryptService = mock<EncryptService>();
  const keyService = mock<KeyService>();
  const userKey = new SymmetricCryptoKey(new Uint8Array(64) as CsprngArray) as UserKey;

  beforeEach(() => {
    encryptService.encryptString.mockImplementation((p) =>
      Promise.resolve(p as unknown as EncString),
    );
    // in the test environment `c.encryptedString` always has a value
    encryptService.decryptString.mockImplementation((c) => Promise.resolve(c.encryptedString!));
    keyService.getUserKey.mockImplementation(() => Promise.resolve(userKey));
    keyService.userKey$.mockImplementation(() => of(true as unknown as UserKey));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("credential$", () => {
    it("returns an empty list when no credentials are stored", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      const result = await firstValueFrom(history.credentials$(SomeUser));

      expect(result).toEqual([]);
    });
  });

  describe("track", () => {
    it("stores a password", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      await history.track(SomeUser, "example", Type.password);
      await awaitAsync();
      const [result] = await firstValueFrom(history.credentials$(SomeUser));

      expect(result).toMatchObject({ credential: "example", category: Type.password });
    });

    it("stores a passphrase", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      await history.track(SomeUser, "example", Type.password);
      await awaitAsync();
      const [result] = await firstValueFrom(history.credentials$(SomeUser));

      expect(result).toMatchObject({ credential: "example", category: Type.password });
    });

    it("stores a specific date when one is provided", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      await history.track(SomeUser, "example", Type.password, new Date(100));
      await awaitAsync();
      const [result] = await firstValueFrom(history.credentials$(SomeUser));

      expect(result).toEqual({
        credential: "example",
        category: Type.password,
        generationDate: new Date(100),
      });
    });

    it("skips storing a credential when it's already stored (ignores category)", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      await history.track(SomeUser, "example", Type.password);
      await history.track(SomeUser, "example", Type.password);
      await history.track(SomeUser, "example", Type.password);
      await awaitAsync();
      const [firstResult, secondResult] = await firstValueFrom(history.credentials$(SomeUser));

      expect(firstResult).toMatchObject({ credential: "example", category: Type.password });
      expect(secondResult).toBeUndefined();
    });

    it("stores multiple credentials when the credential value is different", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      await history.track(SomeUser, "secondResult", Type.password);
      await history.track(SomeUser, "firstResult", Type.password);
      await awaitAsync();
      const [firstResult, secondResult] = await firstValueFrom(history.credentials$(SomeUser));

      expect(firstResult).toMatchObject({ credential: "firstResult", category: Type.password });
      expect(secondResult).toMatchObject({ credential: "secondResult", category: Type.password });
    });

    it("removes history items exceeding maxTotal configuration", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider, {
        maxTotal: 1,
      });

      await history.track(SomeUser, "removed result", Type.password);
      await history.track(SomeUser, "example", Type.password);
      await awaitAsync();
      const [firstResult, secondResult] = await firstValueFrom(history.credentials$(SomeUser));

      expect(firstResult).toMatchObject({ credential: "example", category: Type.password });
      expect(secondResult).toBeUndefined();
    });

    it("stores history items in per-user collections", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider, {
        maxTotal: 1,
      });

      await history.track(SomeUser, "some user example", Type.password);
      await history.track(AnotherUser, "another user example", Type.password);
      await awaitAsync();
      const [someFirstResult, someSecondResult] = await firstValueFrom(
        history.credentials$(SomeUser),
      );
      const [anotherFirstResult, anotherSecondResult] = await firstValueFrom(
        history.credentials$(AnotherUser),
      );

      expect(someFirstResult).toMatchObject({
        credential: "some user example",
        category: Type.password,
      });
      expect(someSecondResult).toBeUndefined();
      expect(anotherFirstResult).toMatchObject({
        credential: "another user example",
        category: Type.password,
      });
      expect(anotherSecondResult).toBeUndefined();
    });
  });

  describe("take", () => {
    it("returns null when there are no credentials stored", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);

      const result = await history.take(SomeUser, "example");

      expect(result).toBeNull();
    });

    it("returns null when the credential wasn't found", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);
      await history.track(SomeUser, "example", Type.password);

      const result = await history.take(SomeUser, "not found");

      expect(result).toBeNull();
    });

    it("returns a matching credential", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);
      await history.track(SomeUser, "example", Type.password);

      const result = await history.take(SomeUser, "example");

      expect(result).toMatchObject({
        credential: "example",
        category: Type.password,
      });
    });

    it("removes a matching credential", async () => {
      const stateProvider = new FakeStateProvider(mockAccountServiceWith(SomeUser));
      const history = new LocalGeneratorHistoryService(encryptService, keyService, stateProvider);
      await history.track(SomeUser, "example", Type.password);

      await history.take(SomeUser, "example");
      await awaitAsync();
      const results = await firstValueFrom(history.credentials$(SomeUser));

      expect(results).toEqual([]);
    });
  });
});
