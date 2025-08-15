import { mock } from "jest-mock-extended";
import { Jsonify } from "type-fest";

import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
// This import has been flagged as unallowed for this class. It may be involved in a circular dependency loop.
// eslint-disable-next-line no-restricted-imports
import { KeyService } from "@bitwarden/key-management";
import {
  CipherType as SdkCipherType,
  UriMatchType,
  CipherRepromptType as SdkCipherRepromptType,
  LoginLinkedIdType,
  Cipher as SdkCipher,
  EncString as SdkEncString,
} from "@bitwarden/sdk-internal";

import { makeStaticByteArray, mockEnc, mockFromJson } from "../../../../spec/utils";
import { EncryptService } from "../../../key-management/crypto/abstractions/encrypt.service";
import { EncString } from "../../../key-management/crypto/models/enc-string";
import { UriMatchStrategy } from "../../../models/domain/domain-service";
import { ContainerService } from "../../../platform/services/container.service";
import { InitializerKey } from "../../../platform/services/cryptography/initializer-key";
import { UserId } from "../../../types/guid";
import { CipherService } from "../../abstractions/cipher.service";
import { FieldType, LoginLinkedId, SecureNoteType } from "../../enums";
import { CipherRepromptType } from "../../enums/cipher-reprompt-type";
import { CipherType } from "../../enums/cipher-type";
import { CipherData } from "../../models/data/cipher.data";
import { Attachment } from "../../models/domain/attachment";
import { Card } from "../../models/domain/card";
import { Cipher } from "../../models/domain/cipher";
import { Field } from "../../models/domain/field";
import { Identity } from "../../models/domain/identity";
import { Login } from "../../models/domain/login";
import { Password } from "../../models/domain/password";
import { SecureNote } from "../../models/domain/secure-note";
import { CardView } from "../../models/view/card.view";
import { IdentityView } from "../../models/view/identity.view";
import { LoginView } from "../../models/view/login.view";
import { CipherPermissionsApi } from "../api/cipher-permissions.api";

describe("Cipher DTO", () => {
  it("Convert from empty CipherData", () => {
    const data = new CipherData();
    const cipher = new Cipher(data);

    expect(cipher).toEqual({
      initializerKey: InitializerKey.Cipher,
      id: null,
      organizationId: null,
      folderId: null,
      name: null,
      notes: null,
      type: undefined,
      favorite: undefined,
      organizationUseTotp: undefined,
      edit: undefined,
      viewPassword: true,
      revisionDate: null,
      collectionIds: undefined,
      localData: null,
      creationDate: null,
      deletedDate: null,
      reprompt: undefined,
      attachments: null,
      fields: null,
      passwordHistory: null,
      key: null,
      permissions: undefined,
    });
  });

  it("Decrypt should handle cipher key error", async () => {
    const cipher = new Cipher();
    cipher.id = "id";
    cipher.organizationId = "orgId";
    cipher.folderId = "folderId";
    cipher.edit = true;
    cipher.viewPassword = true;
    cipher.organizationUseTotp = true;
    cipher.favorite = false;
    cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
    cipher.type = CipherType.Login;
    cipher.name = mockEnc("EncryptedString");
    cipher.notes = mockEnc("EncryptedString");
    cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
    cipher.deletedDate = null;
    cipher.reprompt = CipherRepromptType.None;
    cipher.key = mockEnc("EncKey");
    cipher.permissions = new CipherPermissionsApi();

    const loginView = new LoginView();
    loginView.username = "username";
    loginView.password = "password";

    const login = mock<Login>();
    login.decrypt.mockResolvedValue(loginView);
    cipher.login = login;

    const keyService = mock<KeyService>();
    const encryptService = mock<EncryptService>();
    const cipherService = mock<CipherService>();

    encryptService.unwrapSymmetricKey.mockRejectedValue(new Error("Failed to unwrap key"));

    (window as any).bitwardenContainerService = new ContainerService(keyService, encryptService);

    const cipherView = await cipher.decrypt(
      await cipherService.getKeyForCipherKeyDecryption(cipher, mockUserId),
    );

    expect(cipherView).toMatchObject({
      id: "id",
      organizationId: "orgId",
      folderId: "folderId",
      name: "[error: cannot decrypt]",
      type: 1,
      favorite: false,
      organizationUseTotp: true,
      edit: true,
      viewPassword: true,
      decryptionFailure: true,
      collectionIds: undefined,
      revisionDate: new Date("2022-01-31T12:00:00.000Z"),
      creationDate: new Date("2022-01-01T12:00:00.000Z"),
      deletedDate: null,
      reprompt: 0,
      localData: undefined,
      permissions: new CipherPermissionsApi(),
    });

    expect(login.decrypt).not.toHaveBeenCalled();
  });

  describe("LoginCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Login,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        permissions: new CipherPermissionsApi(),
        reprompt: CipherRepromptType.None,
        key: "EncryptedString",
        login: {
          uris: [
            {
              uri: "EncryptedString",
              uriChecksum: "EncryptedString",
              match: UriMatchStrategy.Domain,
            },
          ],
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          totp: "EncryptedString",
          autofillOnPageLoad: false,
        },
        passwordHistory: [
          { password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" },
        ],
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
        ],
        fields: [
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Text,
            linkedId: null,
          },
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Hidden,
            linkedId: null,
          },
        ],
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toMatchObject({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        permissions: new CipherPermissionsApi(),
        reprompt: 0,
        key: { encryptedString: "EncryptedString", encryptionType: 0 },
        login: {
          passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
          autofillOnPageLoad: false,
          username: { encryptedString: "EncryptedString", encryptionType: 0 },
          password: { encryptedString: "EncryptedString", encryptionType: 0 },
          totp: { encryptedString: "EncryptedString", encryptionType: 0 },
          uris: [
            {
              match: 0,
              uri: { encryptedString: "EncryptedString", encryptionType: 0 },
              uriChecksum: { encryptedString: "EncryptedString", encryptionType: 0 },
            },
          ],
        },
        attachments: [
          {
            fileName: { encryptedString: "file", encryptionType: 0 },
            id: "a1",
            key: { encryptedString: "EncKey", encryptionType: 0 },
            size: "1100",
            sizeName: "1.1 KB",
            url: "url",
          },
          {
            fileName: { encryptedString: "file", encryptionType: 0 },
            id: "a2",
            key: { encryptedString: "EncKey", encryptionType: 0 },
            size: "1100",
            sizeName: "1.1 KB",
            url: "url",
          },
        ],
        fields: [
          {
            linkedId: null,
            name: { encryptedString: "EncryptedString", encryptionType: 0 },
            type: 0,
            value: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
          {
            linkedId: null,
            name: { encryptedString: "EncryptedString", encryptionType: 0 },
            type: 1,
            value: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
        ],
        passwordHistory: [
          {
            lastUsedDate: new Date("2022-01-31T12:00:00.000Z"),
            password: { encryptedString: "EncryptedString", encryptionType: 0 },
          },
        ],
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Login;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");
      cipher.permissions = new CipherPermissionsApi();

      const loginView = new LoginView();
      loginView.username = "username";
      loginView.password = "password";

      const login = mock<Login>();
      login.decrypt.mockResolvedValue(loginView);
      cipher.login = login;

      const keyService = mock<KeyService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.unwrapSymmetricKey.mockResolvedValue(
        new SymmetricCryptoKey(makeStaticByteArray(64)),
      );

      (window as any).bitwardenContainerService = new ContainerService(keyService, encryptService);

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher, mockUserId),
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 1,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        login: loginView,
        attachments: [],
        fields: [],
        passwordHistory: [],
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
        permissions: new CipherPermissionsApi(),
      });
    });
  });

  describe("SecureNoteCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.SecureNote,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncKey",
        secureNote: {
          type: SecureNoteType.Generic,
        },
        permissions: new CipherPermissionsApi(),
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 2,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        secureNote: { type: SecureNoteType.Generic },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
        permissions: new CipherPermissionsApi(),
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.SecureNote;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.secureNote = new SecureNote();
      cipher.secureNote.type = SecureNoteType.Generic;
      cipher.key = mockEnc("EncKey");
      cipher.permissions = new CipherPermissionsApi();

      const keyService = mock<KeyService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.unwrapSymmetricKey.mockResolvedValue(
        new SymmetricCryptoKey(makeStaticByteArray(64)),
      );

      (window as any).bitwardenContainerService = new ContainerService(keyService, encryptService);

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher, mockUserId),
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 2,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        secureNote: { type: 0 },
        attachments: [],
        fields: [],
        passwordHistory: [],
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
        permissions: new CipherPermissionsApi(),
      });
    });
  });

  describe("CardCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Card,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        permissions: new CipherPermissionsApi(),
        reprompt: CipherRepromptType.None,
        card: {
          cardholderName: "EncryptedString",
          brand: "EncryptedString",
          number: "EncryptedString",
          expMonth: "EncryptedString",
          expYear: "EncryptedString",
          code: "EncryptedString",
        },
        key: "EncKey",
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 3,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        card: {
          cardholderName: { encryptedString: "EncryptedString", encryptionType: 0 },
          brand: { encryptedString: "EncryptedString", encryptionType: 0 },
          number: { encryptedString: "EncryptedString", encryptionType: 0 },
          expMonth: { encryptedString: "EncryptedString", encryptionType: 0 },
          expYear: { encryptedString: "EncryptedString", encryptionType: 0 },
          code: { encryptedString: "EncryptedString", encryptionType: 0 },
        },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
        permissions: new CipherPermissionsApi(),
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Card;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");
      cipher.permissions = new CipherPermissionsApi();

      const cardView = new CardView();
      cardView.cardholderName = "cardholderName";
      cardView.number = "4111111111111111";

      const card = mock<Card>();
      card.decrypt.mockResolvedValue(cardView);
      cipher.card = card;

      const keyService = mock<KeyService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.unwrapSymmetricKey.mockResolvedValue(
        new SymmetricCryptoKey(makeStaticByteArray(64)),
      );

      (window as any).bitwardenContainerService = new ContainerService(keyService, encryptService);

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher, mockUserId),
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 3,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        card: cardView,
        attachments: [],
        fields: [],
        passwordHistory: [],
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
        permissions: new CipherPermissionsApi(),
      });
    });
  });

  describe("IdentityCipher", () => {
    let cipherData: CipherData;

    beforeEach(() => {
      cipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Identity,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        permissions: new CipherPermissionsApi(),
        reprompt: CipherRepromptType.None,
        key: "EncKey",
        identity: {
          title: "EncryptedString",
          firstName: "EncryptedString",
          middleName: "EncryptedString",
          lastName: "EncryptedString",
          address1: "EncryptedString",
          address2: "EncryptedString",
          address3: "EncryptedString",
          city: "EncryptedString",
          state: "EncryptedString",
          postalCode: "EncryptedString",
          country: "EncryptedString",
          company: "EncryptedString",
          email: "EncryptedString",
          phone: "EncryptedString",
          ssn: "EncryptedString",
          username: "EncryptedString",
          passportNumber: "EncryptedString",
          licenseNumber: "EncryptedString",
        },
      };
    });

    it("Convert", () => {
      const cipher = new Cipher(cipherData);

      expect(cipher).toEqual({
        initializerKey: InitializerKey.Cipher,
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: { encryptedString: "EncryptedString", encryptionType: 0 },
        notes: { encryptedString: "EncryptedString", encryptionType: 0 },
        type: 4,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        collectionIds: undefined,
        localData: null,
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        identity: {
          title: { encryptedString: "EncryptedString", encryptionType: 0 },
          firstName: { encryptedString: "EncryptedString", encryptionType: 0 },
          middleName: { encryptedString: "EncryptedString", encryptionType: 0 },
          lastName: { encryptedString: "EncryptedString", encryptionType: 0 },
          address1: { encryptedString: "EncryptedString", encryptionType: 0 },
          address2: { encryptedString: "EncryptedString", encryptionType: 0 },
          address3: { encryptedString: "EncryptedString", encryptionType: 0 },
          city: { encryptedString: "EncryptedString", encryptionType: 0 },
          state: { encryptedString: "EncryptedString", encryptionType: 0 },
          postalCode: { encryptedString: "EncryptedString", encryptionType: 0 },
          country: { encryptedString: "EncryptedString", encryptionType: 0 },
          company: { encryptedString: "EncryptedString", encryptionType: 0 },
          email: { encryptedString: "EncryptedString", encryptionType: 0 },
          phone: { encryptedString: "EncryptedString", encryptionType: 0 },
          ssn: { encryptedString: "EncryptedString", encryptionType: 0 },
          username: { encryptedString: "EncryptedString", encryptionType: 0 },
          passportNumber: { encryptedString: "EncryptedString", encryptionType: 0 },
          licenseNumber: { encryptedString: "EncryptedString", encryptionType: 0 },
        },
        attachments: null,
        fields: null,
        passwordHistory: null,
        key: { encryptedString: "EncKey", encryptionType: 0 },
        permissions: new CipherPermissionsApi(),
      });
    });

    it("toCipherData", () => {
      const cipher = new Cipher(cipherData);
      expect(cipher.toCipherData()).toEqual(cipherData);
    });

    it("Decrypt", async () => {
      const cipher = new Cipher();
      cipher.id = "id";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Identity;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.creationDate = new Date("2022-01-01T12:00:00.000Z");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;
      cipher.key = mockEnc("EncKey");
      cipher.permissions = new CipherPermissionsApi();

      const identityView = new IdentityView();
      identityView.firstName = "firstName";
      identityView.lastName = "lastName";

      const identity = mock<Identity>();
      identity.decrypt.mockResolvedValue(identityView);
      cipher.identity = identity;

      const keyService = mock<KeyService>();
      const encryptService = mock<EncryptService>();
      const cipherService = mock<CipherService>();

      encryptService.unwrapSymmetricKey.mockResolvedValue(
        new SymmetricCryptoKey(makeStaticByteArray(64)),
      );

      (window as any).bitwardenContainerService = new ContainerService(keyService, encryptService);

      const cipherView = await cipher.decrypt(
        await cipherService.getKeyForCipherKeyDecryption(cipher, mockUserId),
      );

      expect(cipherView).toMatchObject({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: 4,
        favorite: false,
        organizationUseTotp: true,
        edit: true,
        viewPassword: true,
        identity: identityView,
        attachments: [],
        fields: [],
        passwordHistory: [],
        collectionIds: undefined,
        revisionDate: new Date("2022-01-31T12:00:00.000Z"),
        creationDate: new Date("2022-01-01T12:00:00.000Z"),
        deletedDate: null,
        reprompt: 0,
        localData: undefined,
        permissions: new CipherPermissionsApi(),
      });
    });
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(Attachment, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Field, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Password, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const revisionDate = new Date("2022-08-04T01:06:40.441Z");
      const deletedDate = new Date("2022-09-04T01:06:40.441Z");
      const actual = Cipher.fromJSON({
        name: "myName",
        notes: "myNotes",
        revisionDate: revisionDate.toISOString(),
        attachments: ["attachment1", "attachment2"] as any,
        fields: ["field1", "field2"] as any,
        passwordHistory: ["ph1", "ph2"] as any,
        deletedDate: deletedDate.toISOString(),
      } as Jsonify<Cipher>);

      expect(actual).toMatchObject({
        name: "myName_fromJSON",
        notes: "myNotes_fromJSON",
        revisionDate: revisionDate,
        attachments: ["attachment1_fromJSON", "attachment2_fromJSON"],
        fields: ["field1_fromJSON", "field2_fromJSON"],
        passwordHistory: ["ph1_fromJSON", "ph2_fromJSON"],
        deletedDate: deletedDate,
      });
      expect(actual).toBeInstanceOf(Cipher);
    });

    test.each([
      // Test description, CipherType, expected output
      ["LoginView", CipherType.Login, { login: "myLogin_fromJSON" }],
      ["CardView", CipherType.Card, { card: "myCard_fromJSON" }],
      ["IdentityView", CipherType.Identity, { identity: "myIdentity_fromJSON" }],
      ["Secure Note", CipherType.SecureNote, { secureNote: "mySecureNote_fromJSON" }],
    ])("initializes %s", (description: string, cipherType: CipherType, expected: any) => {
      jest.spyOn(Login, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Identity, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(Card, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(SecureNote, "fromJSON").mockImplementation(mockFromJson);

      const actual = Cipher.fromJSON({
        login: "myLogin",
        card: "myCard",
        identity: "myIdentity",
        secureNote: "mySecureNote",
        type: cipherType,
      } as any);

      expect(actual).toMatchObject(expected);
    });

    it("returns null if object is null", () => {
      expect(Cipher.fromJSON(null)).toBeNull();
    });
  });

  describe("toSdkCipher", () => {
    it("should map to SDK Cipher", () => {
      const lastUsedDate = new Date("2025-04-15T12:00:00.000Z").getTime();
      const lastLaunched = new Date("2025-04-15T12:00:00.000Z").getTime();

      const cipherData: CipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        permissions: new CipherPermissionsApi(),
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Login,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncryptedString",
        login: {
          uris: [
            {
              uri: "EncryptedString",
              uriChecksum: "EncryptedString",
              match: UriMatchStrategy.Domain,
            },
          ],
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          totp: "EncryptedString",
          autofillOnPageLoad: false,
        },
        passwordHistory: [
          { password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" },
        ],
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
        ],
        fields: [
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedId.Username,
          },
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedId.Password,
          },
        ],
      };

      const cipher = new Cipher(cipherData, { lastUsedDate, lastLaunched });
      const sdkCipher = cipher.toSdkCipher();

      expect(sdkCipher).toEqual({
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        collectionIds: [],
        key: "EncryptedString",
        name: "EncryptedString",
        notes: "EncryptedString",
        type: SdkCipherType.Login,
        login: {
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          uris: [
            {
              uri: "EncryptedString",
              uriChecksum: "EncryptedString",
              match: UriMatchType.Domain,
            },
          ],
          totp: "EncryptedString",
          autofillOnPageLoad: false,
          fido2Credentials: undefined,
        },
        identity: undefined,
        card: undefined,
        secureNote: undefined,
        sshKey: undefined,
        favorite: false,
        reprompt: SdkCipherRepromptType.None,
        organizationUseTotp: true,
        edit: true,
        permissions: {
          delete: false,
          restore: false,
        },
        viewPassword: true,
        localData: {
          lastUsedDate: "2025-04-15T12:00:00.000Z",
          lastLaunched: "2025-04-15T12:00:00.000Z",
        },
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
        ],
        fields: [
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedIdType.Username,
          },
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedIdType.Password,
          },
        ],
        passwordHistory: [
          {
            password: "EncryptedString",
            lastUsedDate: "2022-01-31T12:00:00.000Z",
          },
        ],
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: undefined,
        revisionDate: "2022-01-31T12:00:00.000Z",
      });
    });

    it("should map from SDK Cipher", () => {
      jest.restoreAllMocks();
      const sdkCipher: SdkCipher = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        collectionIds: [],
        key: "EncryptedString" as SdkEncString,
        name: "EncryptedString" as SdkEncString,
        notes: "EncryptedString" as SdkEncString,
        type: SdkCipherType.Login,
        login: {
          username: "EncryptedString" as SdkEncString,
          password: "EncryptedString" as SdkEncString,
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          uris: [
            {
              uri: "EncryptedString" as SdkEncString,
              uriChecksum: "EncryptedString" as SdkEncString,
              match: UriMatchType.Domain,
            },
          ],
          totp: "EncryptedString" as SdkEncString,
          autofillOnPageLoad: false,
          fido2Credentials: undefined,
        },
        identity: undefined,
        card: undefined,
        secureNote: undefined,
        sshKey: undefined,
        favorite: false,
        reprompt: SdkCipherRepromptType.None,
        organizationUseTotp: true,
        edit: true,
        permissions: new CipherPermissionsApi(),
        viewPassword: true,
        localData: {
          lastUsedDate: "2025-04-15T12:00:00.000Z",
          lastLaunched: "2025-04-15T12:00:00.000Z",
        },
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file" as SdkEncString,
            key: "EncKey" as SdkEncString,
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file" as SdkEncString,
            key: "EncKey" as SdkEncString,
          },
        ],
        fields: [
          {
            name: "EncryptedString" as SdkEncString,
            value: "EncryptedString" as SdkEncString,
            type: FieldType.Linked,
            linkedId: LoginLinkedIdType.Username,
          },
          {
            name: "EncryptedString" as SdkEncString,
            value: "EncryptedString" as SdkEncString,
            type: FieldType.Linked,
            linkedId: LoginLinkedIdType.Password,
          },
        ],
        passwordHistory: [
          {
            password: "EncryptedString" as SdkEncString,
            lastUsedDate: "2022-01-31T12:00:00.000Z",
          },
        ],
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: undefined,
        revisionDate: "2022-01-31T12:00:00.000Z",
      };

      const lastUsedDate = new Date("2025-04-15T12:00:00.000Z").getTime();
      const lastLaunched = new Date("2025-04-15T12:00:00.000Z").getTime();

      const cipherData: CipherData = {
        id: "id",
        organizationId: "orgId",
        folderId: "folderId",
        edit: true,
        permissions: new CipherPermissionsApi(),
        collectionIds: [],
        viewPassword: true,
        organizationUseTotp: true,
        favorite: false,
        revisionDate: "2022-01-31T12:00:00.000Z",
        type: CipherType.Login,
        name: "EncryptedString",
        notes: "EncryptedString",
        creationDate: "2022-01-01T12:00:00.000Z",
        deletedDate: null,
        reprompt: CipherRepromptType.None,
        key: "EncryptedString",
        login: {
          uris: [
            {
              uri: "EncryptedString",
              uriChecksum: "EncryptedString",
              match: UriMatchStrategy.Domain,
            },
          ],
          username: "EncryptedString",
          password: "EncryptedString",
          passwordRevisionDate: "2022-01-31T12:00:00.000Z",
          totp: "EncryptedString",
          autofillOnPageLoad: false,
        },
        passwordHistory: [
          { password: "EncryptedString", lastUsedDate: "2022-01-31T12:00:00.000Z" },
        ],
        attachments: [
          {
            id: "a1",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
          {
            id: "a2",
            url: "url",
            size: "1100",
            sizeName: "1.1 KB",
            fileName: "file",
            key: "EncKey",
          },
        ],
        fields: [
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedId.Username,
          },
          {
            name: "EncryptedString",
            value: "EncryptedString",
            type: FieldType.Linked,
            linkedId: LoginLinkedId.Password,
          },
        ],
      };
      const expectedCipher = new Cipher(cipherData, { lastUsedDate, lastLaunched });

      const cipher = Cipher.fromSdkCipher(sdkCipher);

      expect(cipher).toEqual(expectedCipher);
    });
  });
});

const mockUserId = "TestUserId" as UserId;
