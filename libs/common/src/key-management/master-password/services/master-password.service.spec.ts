import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, of } from "rxjs";
import * as rxjs from "rxjs";

import { SdkLoadService } from "@bitwarden/common/platform/abstractions/sdk/sdk-load.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
// eslint-disable-next-line no-restricted-imports
import { KdfConfig, PBKDF2KdfConfig } from "@bitwarden/key-management";

import {
  FakeAccountService,
  makeSymmetricCryptoKey,
  mockAccountServiceWith,
} from "../../../../spec";
import { ForceSetPasswordReason } from "../../../auth/models/domain/force-set-password-reason";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { LogService } from "../../../platform/abstractions/log.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { StateProvider } from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { MasterKey, UserKey } from "../../../types/key";
import { CryptoFunctionService } from "../../crypto/abstractions/crypto-function.service";
import { EncryptService } from "../../crypto/abstractions/encrypt.service";
import { EncString } from "../../crypto/models/enc-string";
import { MasterPasswordSalt } from "../types/master-password.types";

import { MasterPasswordService } from "./master-password.service";

describe("MasterPasswordService", () => {
  let sut: MasterPasswordService;

  let stateProvider: MockProxy<StateProvider>;
  let stateService: MockProxy<StateService>;
  let keyGenerationService: MockProxy<KeyGenerationService>;
  let encryptService: MockProxy<EncryptService>;
  let logService: MockProxy<LogService>;
  let cryptoFunctionService: MockProxy<CryptoFunctionService>;
  let accountService: FakeAccountService;

  const userId = "00000000-0000-0000-0000-000000000000" as UserId;
  const mockUserState = {
    state$: of(null),
    update: jest.fn().mockResolvedValue(null),
  };

  const testUserKey: SymmetricCryptoKey = makeSymmetricCryptoKey(64, 1);
  const testMasterKey: MasterKey = makeSymmetricCryptoKey(32, 2);
  const testStretchedMasterKey: SymmetricCryptoKey = makeSymmetricCryptoKey(64, 3);
  const testMasterKeyEncryptedKey =
    "0.gbauOANURUHqvhLTDnva1A==|nSW+fPumiuTaDB/s12+JO88uemV6rhwRSR+YR1ZzGr5j6Ei3/h+XEli2Unpz652NlZ9NTuRpHxeOqkYYJtp7J+lPMoclgteXuAzUu9kqlRc=";
  const testStretchedMasterKeyEncryptedKey =
    "2.gbauOANURUHqvhLTDnva1A==|nSW+fPumiuTaDB/s12+JO88uemV6rhwRSR+YR1ZzGr5j6Ei3/h+XEli2Unpz652NlZ9NTuRpHxeOqkYYJtp7J+lPMoclgteXuAzUu9kqlRc=|DeUFkhIwgkGdZA08bDnDqMMNmZk21D+H5g8IostPKAY=";

  beforeEach(() => {
    stateProvider = mock<StateProvider>();
    stateService = mock<StateService>();
    keyGenerationService = mock<KeyGenerationService>();
    encryptService = mock<EncryptService>();
    logService = mock<LogService>();
    cryptoFunctionService = mock<CryptoFunctionService>();
    accountService = mockAccountServiceWith(userId);

    stateProvider.getUser.mockReturnValue(mockUserState as any);

    mockUserState.update.mockReset();

    sut = new MasterPasswordService(
      stateProvider,
      stateService,
      keyGenerationService,
      encryptService,
      logService,
      cryptoFunctionService,
      accountService,
    );

    encryptService.unwrapSymmetricKey.mockResolvedValue(makeSymmetricCryptoKey(64, 1));
    keyGenerationService.stretchKey.mockResolvedValue(makeSymmetricCryptoKey(64, 3));
    Object.defineProperty(SdkLoadService, "Ready", {
      value: Promise.resolve(),
      configurable: true,
    });
  });

  describe("saltForUser$", () => {
    it("throws when userid not present", async () => {
      expect(() => {
        sut.saltForUser$(null as unknown as UserId);
      }).toThrow("userId is null or undefined.");
    });
    it("throws when userid present but not in account service", async () => {
      await expect(
        firstValueFrom(sut.saltForUser$("00000000-0000-0000-0000-000000000001" as UserId)),
      ).rejects.toThrow("Cannot read properties of undefined (reading 'email')");
    });
    it("returns salt", async () => {
      const salt = await firstValueFrom(sut.saltForUser$(userId));
      expect(salt).toBeDefined();
    });
  });

  describe("setForceSetPasswordReason", () => {
    it("calls stateProvider with the provided reason and user ID", async () => {
      const reason = ForceSetPasswordReason.WeakMasterPassword;

      await sut.setForceSetPasswordReason(reason, userId);

      expect(stateProvider.getUser).toHaveBeenCalled();
      expect(mockUserState.update).toHaveBeenCalled();

      // Call the update function to verify it returns the correct reason
      const updateFn = mockUserState.update.mock.calls[0][0];
      expect(updateFn(null)).toBe(reason);
    });

    it("throws an error if reason is null", async () => {
      await expect(
        sut.setForceSetPasswordReason(null as unknown as ForceSetPasswordReason, userId),
      ).rejects.toThrow("Reason is required.");
    });

    it("throws an error if user ID is null", async () => {
      await expect(
        sut.setForceSetPasswordReason(ForceSetPasswordReason.None, null as unknown as UserId),
      ).rejects.toThrow("User ID is required.");
    });

    it("does not overwrite AdminForcePasswordReset with other reasons except None", async () => {
      jest
        .spyOn(sut, "forceSetPasswordReason$")
        .mockReturnValue(of(ForceSetPasswordReason.AdminForcePasswordReset));

      jest
        .spyOn(rxjs, "firstValueFrom")
        .mockResolvedValue(ForceSetPasswordReason.AdminForcePasswordReset);

      await sut.setForceSetPasswordReason(ForceSetPasswordReason.WeakMasterPassword, userId);

      expect(mockUserState.update).not.toHaveBeenCalled();
    });

    it("allows overwriting AdminForcePasswordReset with None", async () => {
      jest
        .spyOn(sut, "forceSetPasswordReason$")
        .mockReturnValue(of(ForceSetPasswordReason.AdminForcePasswordReset));

      jest
        .spyOn(rxjs, "firstValueFrom")
        .mockResolvedValue(ForceSetPasswordReason.AdminForcePasswordReset);

      await sut.setForceSetPasswordReason(ForceSetPasswordReason.None, userId);

      expect(mockUserState.update).toHaveBeenCalled();
    });
  });
  describe("decryptUserKeyWithMasterKey", () => {
    it("decrypts a userkey wrapped in AES256-CBC", async () => {
      encryptService.unwrapSymmetricKey.mockResolvedValue(testUserKey);
      await sut.decryptUserKeyWithMasterKey(
        testMasterKey,
        userId,
        new EncString(testMasterKeyEncryptedKey),
      );
      expect(encryptService.unwrapSymmetricKey).toHaveBeenCalledWith(
        new EncString(testMasterKeyEncryptedKey),
        testMasterKey,
      );
    });
    it("decrypts a userkey wrapped in AES256-CBC-HMAC", async () => {
      encryptService.unwrapSymmetricKey.mockResolvedValue(testUserKey);
      keyGenerationService.stretchKey.mockResolvedValue(testStretchedMasterKey);
      await sut.decryptUserKeyWithMasterKey(
        testMasterKey,
        userId,
        new EncString(testStretchedMasterKeyEncryptedKey),
      );
      expect(encryptService.unwrapSymmetricKey).toHaveBeenCalledWith(
        new EncString(testStretchedMasterKeyEncryptedKey),
        testStretchedMasterKey,
      );
      expect(keyGenerationService.stretchKey).toHaveBeenCalledWith(testMasterKey);
    });
    it("returns null if failed to decrypt", async () => {
      encryptService.unwrapSymmetricKey.mockResolvedValue(null);
      const result = await sut.decryptUserKeyWithMasterKey(
        testMasterKey,
        userId,
        new EncString(testStretchedMasterKeyEncryptedKey),
      );
      expect(result).toBeNull();
    });
  });

  describe("setMasterKeyEncryptedUserKey", () => {
    test.each([null as unknown as EncString, undefined as unknown as EncString])(
      "throws when the provided encryptedKey is %s",
      async (encryptedKey) => {
        await expect(sut.setMasterKeyEncryptedUserKey(encryptedKey, userId)).rejects.toThrow(
          "Encrypted Key is required.",
        );
      },
    );

    it("throws an error if encryptedKey is malformed null", async () => {
      await expect(
        sut.setMasterKeyEncryptedUserKey(new EncString(null as unknown as string), userId),
      ).rejects.toThrow("Encrypted Key is required.");
    });

    test.each([null as unknown as UserId, undefined as unknown as UserId])(
      "throws when the provided userId is %s",
      async (userId) => {
        await expect(
          sut.setMasterKeyEncryptedUserKey(new EncString(testMasterKeyEncryptedKey), userId),
        ).rejects.toThrow("User ID is required.");
      },
    );

    it("calls stateProvider with the provided encryptedKey and user ID", async () => {
      const encryptedKey = new EncString(testMasterKeyEncryptedKey);

      await sut.setMasterKeyEncryptedUserKey(encryptedKey, userId);

      expect(stateProvider.getUser).toHaveBeenCalled();
      expect(mockUserState.update).toHaveBeenCalled();
      const updateFn = mockUserState.update.mock.calls[0][0];
      expect(updateFn(null)).toEqual(encryptedKey.toJSON());
    });
  });

  describe("makeMasterPasswordAuthenticationData", () => {
    const password = "test-password";
    const kdf: KdfConfig = new PBKDF2KdfConfig(600_000);
    const salt = "test@bitwarden.com" as MasterPasswordSalt;
    const masterKey = makeSymmetricCryptoKey(32, 2);
    const masterKeyHash = makeSymmetricCryptoKey(32, 3).toEncoded();

    beforeEach(() => {
      keyGenerationService.deriveKeyFromPassword.mockResolvedValue(masterKey);
      cryptoFunctionService.pbkdf2.mockResolvedValue(masterKeyHash);
    });

    it("derives master key and creates authentication hash", async () => {
      const result = await sut.makeMasterPasswordAuthenticationData(password, kdf, salt);

      expect(keyGenerationService.deriveKeyFromPassword).toHaveBeenCalledWith(password, salt, kdf);
      expect(cryptoFunctionService.pbkdf2).toHaveBeenCalledWith(
        masterKey.toEncoded(),
        password,
        "sha256",
        1,
      );

      expect(result).toEqual({
        kdf,
        salt,
        masterPasswordAuthenticationHash: Utils.fromBufferToB64(masterKeyHash),
      });
    });

    it("throws if password is null", async () => {
      await expect(
        sut.makeMasterPasswordAuthenticationData(null as unknown as string, kdf, salt),
      ).rejects.toThrow();
    });
    it("throws if kdf is null", async () => {
      await expect(
        sut.makeMasterPasswordAuthenticationData(password, null as unknown as KdfConfig, salt),
      ).rejects.toThrow();
    });
    it("throws if salt is null", async () => {
      await expect(
        sut.makeMasterPasswordAuthenticationData(
          password,
          kdf,
          null as unknown as MasterPasswordSalt,
        ),
      ).rejects.toThrow();
    });
  });

  describe("wrapUnwrapUserKeyWithPassword", () => {
    const password = "test-password";
    const kdf: KdfConfig = new PBKDF2KdfConfig(600_000);
    const salt = "test@bitwarden.com" as MasterPasswordSalt;
    const userKey = makeSymmetricCryptoKey(64, 2) as UserKey;

    it("wraps and unwraps user key with password", async () => {
      const unlockData = await sut.makeMasterPasswordUnlockData(password, kdf, salt, userKey);
      const unwrappedUserkey = await sut.unwrapUserKeyFromMasterPasswordUnlockData(
        password,
        unlockData,
      );
      expect(unwrappedUserkey).toEqual(userKey);
    });

    it("throws if password is null", async () => {
      await expect(
        sut.makeMasterPasswordUnlockData(null as unknown as string, kdf, salt, userKey),
      ).rejects.toThrow();
    });
    it("throws if kdf is null", async () => {
      await expect(
        sut.makeMasterPasswordUnlockData(password, null as unknown as KdfConfig, salt, userKey),
      ).rejects.toThrow();
    });
    it("throws if salt is null", async () => {
      await expect(
        sut.makeMasterPasswordUnlockData(
          password,
          kdf,
          null as unknown as MasterPasswordSalt,
          userKey,
        ),
      ).rejects.toThrow();
    });
    it("throws if userKey is null", async () => {
      await expect(
        sut.makeMasterPasswordUnlockData(password, kdf, salt, null as unknown as UserKey),
      ).rejects.toThrow();
    });
  });
});
