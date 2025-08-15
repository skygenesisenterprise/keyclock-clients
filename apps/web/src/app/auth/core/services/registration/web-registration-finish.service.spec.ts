// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { MockProxy, mock } from "jest-mock-extended";
import { of } from "rxjs";

import { PasswordInputResult } from "@bitwarden/auth/angular";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { MasterPasswordPolicyOptions } from "@bitwarden/common/admin-console/models/domain/master-password-policy-options";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { OrganizationInvite } from "@bitwarden/common/auth/services/organization-invite/organization-invite";
import { OrganizationInviteService } from "@bitwarden/common/auth/services/organization-invite/organization-invite.service";
import { EncString } from "@bitwarden/common/key-management/crypto/models/enc-string";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "@bitwarden/common/types/csprng";
import { MasterKey, UserKey } from "@bitwarden/common/types/key";
import { DEFAULT_KDF_CONFIG, KeyService } from "@bitwarden/key-management";

import { WebRegistrationFinishService } from "./web-registration-finish.service";

describe("WebRegistrationFinishService", () => {
  let service: WebRegistrationFinishService;

  let keyService: MockProxy<KeyService>;
  let accountApiService: MockProxy<AccountApiService>;
  let organizationInviteService: MockProxy<OrganizationInviteService>;
  let policyApiService: MockProxy<PolicyApiServiceAbstraction>;
  let logService: MockProxy<LogService>;
  let policyService: MockProxy<PolicyService>;

  beforeEach(() => {
    keyService = mock<KeyService>();
    accountApiService = mock<AccountApiService>();
    organizationInviteService = mock<OrganizationInviteService>();
    policyApiService = mock<PolicyApiServiceAbstraction>();
    logService = mock<LogService>();
    policyService = mock<PolicyService>();

    service = new WebRegistrationFinishService(
      keyService,
      accountApiService,
      organizationInviteService,
      policyApiService,
      logService,
      policyService,
    );
  });

  it("instantiates", () => {
    expect(service).not.toBeFalsy();
  });

  describe("getOrgNameFromOrgInvite()", () => {
    let orgInvite: OrganizationInvite | null;

    beforeEach(() => {
      orgInvite = new OrganizationInvite();
      orgInvite.organizationId = "organizationId";
      orgInvite.organizationUserId = "organizationUserId";
      orgInvite.token = "orgInviteToken";
      orgInvite.email = "email";
    });

    it("returns null when the org invite is null", async () => {
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      const result = await service.getOrgNameFromOrgInvite();

      expect(result).toBeNull();
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
    });

    it("returns the organization name from the organization invite when it exists", async () => {
      organizationInviteService.getOrganizationInvite.mockResolvedValue(orgInvite);

      const result = await service.getOrgNameFromOrgInvite();

      expect(result).toEqual(orgInvite.organizationName);
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
    });
  });

  describe("getMasterPasswordPolicyOptsFromOrgInvite()", () => {
    let orgInvite: OrganizationInvite | null;

    beforeEach(() => {
      orgInvite = new OrganizationInvite();
      orgInvite.organizationId = "organizationId";
      orgInvite.organizationUserId = "organizationUserId";
      orgInvite.token = "orgInviteToken";
      orgInvite.email = "email";
    });

    it("returns null when the org invite is null", async () => {
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      const result = await service.getMasterPasswordPolicyOptsFromOrgInvite();

      expect(result).toBeNull();
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
    });

    it("returns null when the policies are null", async () => {
      organizationInviteService.getOrganizationInvite.mockResolvedValue(orgInvite);
      policyApiService.getPoliciesByToken.mockResolvedValue(null);

      const result = await service.getMasterPasswordPolicyOptsFromOrgInvite();

      expect(result).toBeNull();
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
      expect(policyApiService.getPoliciesByToken).toHaveBeenCalledWith(
        orgInvite.organizationId,
        orgInvite.token,
        orgInvite.email,
        orgInvite.organizationUserId,
      );
    });

    it("logs an error and returns null when policies cannot be fetched", async () => {
      organizationInviteService.getOrganizationInvite.mockResolvedValue(orgInvite);
      policyApiService.getPoliciesByToken.mockRejectedValue(new Error("error"));

      const result = await service.getMasterPasswordPolicyOptsFromOrgInvite();

      expect(result).toBeNull();
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
      expect(policyApiService.getPoliciesByToken).toHaveBeenCalledWith(
        orgInvite.organizationId,
        orgInvite.token,
        orgInvite.email,
        orgInvite.organizationUserId,
      );
      expect(logService.error).toHaveBeenCalled();
    });

    it("returns the master password policy options from the organization invite when it exists", async () => {
      const masterPasswordPolicies = [new Policy()];
      const masterPasswordPolicyOptions = new MasterPasswordPolicyOptions();

      organizationInviteService.getOrganizationInvite.mockResolvedValue(orgInvite);
      policyApiService.getPoliciesByToken.mockResolvedValue(masterPasswordPolicies);
      policyService.masterPasswordPolicyOptions$.mockReturnValue(of(masterPasswordPolicyOptions));

      const result = await service.getMasterPasswordPolicyOptsFromOrgInvite();

      expect(result).toEqual(masterPasswordPolicyOptions);
      expect(organizationInviteService.getOrganizationInvite).toHaveBeenCalled();
      expect(policyApiService.getPoliciesByToken).toHaveBeenCalledWith(
        orgInvite.organizationId,
        orgInvite.token,
        orgInvite.email,
        orgInvite.organizationUserId,
      );
    });
  });

  describe("finishRegistration()", () => {
    let email: string;
    let emailVerificationToken: string;
    let masterKey: MasterKey;
    let passwordInputResult: PasswordInputResult;
    let userKey: UserKey;
    let userKeyEncString: EncString;
    let userKeyPair: [string, EncString];

    let orgInvite: OrganizationInvite;
    let orgSponsoredFreeFamilyPlanToken: string;
    let acceptEmergencyAccessInviteToken: string;
    let emergencyAccessId: string;
    let providerInviteToken: string;
    let providerUserId: string;

    beforeEach(() => {
      email = "test@email.com";
      emailVerificationToken = "emailVerificationToken";
      masterKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as MasterKey;
      passwordInputResult = {
        newMasterKey: masterKey,
        newServerMasterKeyHash: "newServerMasterKeyHash",
        newLocalMasterKeyHash: "newLocalMasterKeyHash",
        kdfConfig: DEFAULT_KDF_CONFIG,
        newPasswordHint: "newPasswordHint",
        newPassword: "newPassword",
      };

      userKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as UserKey;
      userKeyEncString = new EncString("userKeyEncrypted");

      userKeyPair = ["publicKey", new EncString("privateKey")];

      orgInvite = new OrganizationInvite();
      orgInvite.organizationUserId = "organizationUserId";
      orgInvite.token = "orgInviteToken";

      orgSponsoredFreeFamilyPlanToken = "orgSponsoredFreeFamilyPlanToken";
      acceptEmergencyAccessInviteToken = "acceptEmergencyAccessInviteToken";
      emergencyAccessId = "emergencyAccessId";
      providerInviteToken = "providerInviteToken";
      providerUserId = "providerUserId";
    });

    it("throws an error if the user key cannot be created", async () => {
      keyService.makeUserKey.mockResolvedValue([null, null]);

      await expect(service.finishRegistration(email, passwordInputResult)).rejects.toThrow(
        "User key could not be created",
      );
    });

    it("registers the user when given valid email verification input", async () => {
      keyService.makeUserKey.mockResolvedValue([userKey, userKeyEncString]);
      keyService.makeKeyPair.mockResolvedValue(userKeyPair);
      accountApiService.registerFinish.mockResolvedValue();
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      await service.finishRegistration(email, passwordInputResult, emailVerificationToken);

      expect(keyService.makeUserKey).toHaveBeenCalledWith(masterKey);
      expect(keyService.makeKeyPair).toHaveBeenCalledWith(userKey);
      expect(accountApiService.registerFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          emailVerificationToken: emailVerificationToken,
          masterPasswordHash: passwordInputResult.newServerMasterKeyHash,
          masterPasswordHint: passwordInputResult.newPasswordHint,
          userSymmetricKey: userKeyEncString.encryptedString,
          userAsymmetricKeys: {
            publicKey: userKeyPair[0],
            encryptedPrivateKey: userKeyPair[1].encryptedString,
          },
          kdf: passwordInputResult.kdfConfig.kdfType,
          kdfIterations: passwordInputResult.kdfConfig.iterations,
          kdfMemory: undefined,
          kdfParallelism: undefined,
          orgInviteToken: undefined,
          organizationUserId: undefined,
          orgSponsoredFreeFamilyPlanToken: undefined,
          acceptEmergencyAccessInviteToken: undefined,
          acceptEmergencyAccessId: undefined,
          providerInviteToken: undefined,
          providerUserId: undefined,
        }),
      );
    });

    it("it registers the user when given an org invite", async () => {
      keyService.makeUserKey.mockResolvedValue([userKey, userKeyEncString]);
      keyService.makeKeyPair.mockResolvedValue(userKeyPair);
      accountApiService.registerFinish.mockResolvedValue();
      organizationInviteService.getOrganizationInvite.mockResolvedValue(orgInvite);

      await service.finishRegistration(email, passwordInputResult);

      expect(keyService.makeUserKey).toHaveBeenCalledWith(masterKey);
      expect(keyService.makeKeyPair).toHaveBeenCalledWith(userKey);
      expect(accountApiService.registerFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          emailVerificationToken: undefined,
          masterPasswordHash: passwordInputResult.newServerMasterKeyHash,
          masterPasswordHint: passwordInputResult.newPasswordHint,
          userSymmetricKey: userKeyEncString.encryptedString,
          userAsymmetricKeys: {
            publicKey: userKeyPair[0],
            encryptedPrivateKey: userKeyPair[1].encryptedString,
          },
          kdf: passwordInputResult.kdfConfig.kdfType,
          kdfIterations: passwordInputResult.kdfConfig.iterations,
          kdfMemory: undefined,
          kdfParallelism: undefined,
          orgInviteToken: orgInvite.token,
          organizationUserId: orgInvite.organizationUserId,
          orgSponsoredFreeFamilyPlanToken: undefined,
          acceptEmergencyAccessInviteToken: undefined,
          acceptEmergencyAccessId: undefined,
          providerInviteToken: undefined,
          providerUserId: undefined,
        }),
      );
    });

    it("registers the user when given an org sponsored free family plan token", async () => {
      keyService.makeUserKey.mockResolvedValue([userKey, userKeyEncString]);
      keyService.makeKeyPair.mockResolvedValue(userKeyPair);
      accountApiService.registerFinish.mockResolvedValue();
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      await service.finishRegistration(
        email,
        passwordInputResult,
        undefined,
        orgSponsoredFreeFamilyPlanToken,
      );

      expect(keyService.makeUserKey).toHaveBeenCalledWith(masterKey);
      expect(keyService.makeKeyPair).toHaveBeenCalledWith(userKey);
      expect(accountApiService.registerFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          emailVerificationToken: undefined,
          masterPasswordHash: passwordInputResult.newServerMasterKeyHash,
          masterPasswordHint: passwordInputResult.newPasswordHint,
          userSymmetricKey: userKeyEncString.encryptedString,
          userAsymmetricKeys: {
            publicKey: userKeyPair[0],
            encryptedPrivateKey: userKeyPair[1].encryptedString,
          },
          kdf: passwordInputResult.kdfConfig.kdfType,
          kdfIterations: passwordInputResult.kdfConfig.iterations,
          kdfMemory: undefined,
          kdfParallelism: undefined,
          orgInviteToken: undefined,
          organizationUserId: undefined,
          orgSponsoredFreeFamilyPlanToken: orgSponsoredFreeFamilyPlanToken,
          acceptEmergencyAccessInviteToken: undefined,
          acceptEmergencyAccessId: undefined,
          providerInviteToken: undefined,
          providerUserId: undefined,
        }),
      );
    });

    it("registers the user when given an emergency access invite token", async () => {
      keyService.makeUserKey.mockResolvedValue([userKey, userKeyEncString]);
      keyService.makeKeyPair.mockResolvedValue(userKeyPair);
      accountApiService.registerFinish.mockResolvedValue();
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      await service.finishRegistration(
        email,
        passwordInputResult,
        undefined,
        undefined,
        acceptEmergencyAccessInviteToken,
        emergencyAccessId,
      );

      expect(keyService.makeUserKey).toHaveBeenCalledWith(masterKey);
      expect(keyService.makeKeyPair).toHaveBeenCalledWith(userKey);
      expect(accountApiService.registerFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          emailVerificationToken: undefined,
          masterPasswordHash: passwordInputResult.newServerMasterKeyHash,
          masterPasswordHint: passwordInputResult.newPasswordHint,
          userSymmetricKey: userKeyEncString.encryptedString,
          userAsymmetricKeys: {
            publicKey: userKeyPair[0],
            encryptedPrivateKey: userKeyPair[1].encryptedString,
          },
          kdf: passwordInputResult.kdfConfig.kdfType,
          kdfIterations: passwordInputResult.kdfConfig.iterations,
          kdfMemory: undefined,
          kdfParallelism: undefined,
          orgInviteToken: undefined,
          organizationUserId: undefined,
          orgSponsoredFreeFamilyPlanToken: undefined,
          acceptEmergencyAccessInviteToken: acceptEmergencyAccessInviteToken,
          acceptEmergencyAccessId: emergencyAccessId,
          providerInviteToken: undefined,
          providerUserId: undefined,
        }),
      );
    });

    it("registers the user when given a provider invite token", async () => {
      keyService.makeUserKey.mockResolvedValue([userKey, userKeyEncString]);
      keyService.makeKeyPair.mockResolvedValue(userKeyPair);
      accountApiService.registerFinish.mockResolvedValue();
      organizationInviteService.getOrganizationInvite.mockResolvedValue(null);

      await service.finishRegistration(
        email,
        passwordInputResult,
        undefined,
        undefined,
        undefined,
        undefined,
        providerInviteToken,
        providerUserId,
      );

      expect(keyService.makeUserKey).toHaveBeenCalledWith(masterKey);
      expect(keyService.makeKeyPair).toHaveBeenCalledWith(userKey);
      expect(accountApiService.registerFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          emailVerificationToken: undefined,
          masterPasswordHash: passwordInputResult.newServerMasterKeyHash,
          masterPasswordHint: passwordInputResult.newPasswordHint,
          userSymmetricKey: userKeyEncString.encryptedString,
          userAsymmetricKeys: {
            publicKey: userKeyPair[0],
            encryptedPrivateKey: userKeyPair[1].encryptedString,
          },
          kdf: passwordInputResult.kdfConfig.kdfType,
          kdfIterations: passwordInputResult.kdfConfig.iterations,
          kdfMemory: undefined,
          kdfParallelism: undefined,
          orgInviteToken: undefined,
          organizationUserId: undefined,
          orgSponsoredFreeFamilyPlanToken: undefined,
          acceptEmergencyAccessInviteToken: undefined,
          acceptEmergencyAccessId: undefined,
          providerInviteToken: providerInviteToken,
          providerUserId: providerUserId,
        }),
      );
    });
  });
});
