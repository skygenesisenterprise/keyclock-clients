import {
  Field as SdkField,
  FieldType,
  LoginLinkedIdType,
  CardLinkedIdType,
  IdentityLinkedIdType,
} from "@bitwarden/sdk-internal";

import { mockEnc, mockFromJson } from "../../../../spec";
import { EncryptedString, EncString } from "../../../key-management/crypto/models/enc-string";
import { CardLinkedId, IdentityLinkedId, LoginLinkedId } from "../../enums";
import { FieldData } from "../../models/data/field.data";
import { Field } from "../../models/domain/field";

describe("Field", () => {
  let data: FieldData;

  beforeEach(() => {
    data = {
      type: FieldType.Text,
      name: "encName",
      value: "encValue",
      linkedId: null,
    };
  });

  it("Convert from empty", () => {
    const data = new FieldData();
    const field = new Field(data);

    expect(field).toEqual({
      type: undefined,
      name: null,
      value: null,
      linkedId: undefined,
    });
  });

  it("Convert", () => {
    const field = new Field(data);

    expect(field).toEqual({
      type: FieldType.Text,
      name: { encryptedString: "encName", encryptionType: 0 },
      value: { encryptedString: "encValue", encryptionType: 0 },
      linkedId: null,
    });
  });

  it("toFieldData", () => {
    const field = new Field(data);
    expect(field.toFieldData()).toEqual(data);
  });

  it("Decrypt", async () => {
    const field = new Field();
    field.type = FieldType.Text;
    field.name = mockEnc("encName");
    field.value = mockEnc("encValue");

    const view = await field.decrypt(null);

    expect(view).toEqual({
      type: 0,
      name: "encName",
      value: "encValue",
      newField: false,
      showCount: false,
      showValue: false,
    });
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const actual = Field.fromJSON({
        name: "myName" as EncryptedString,
        value: "myValue" as EncryptedString,
      });

      expect(actual).toEqual({
        name: "myName_fromJSON",
        value: "myValue_fromJSON",
      });
      expect(actual).toBeInstanceOf(Field);
    });

    it("returns null if object is null", () => {
      expect(Field.fromJSON(null)).toBeNull();
    });
  });

  describe("SDK Field Mapping", () => {
    it("should map to SDK Field", () => {
      // Test Login LinkedId
      const loginField = new Field(data);
      loginField.type = FieldType.Linked;
      loginField.linkedId = LoginLinkedId.Username;
      expect(loginField.toSdkField().linkedId).toBe(100);

      // Test Card LinkedId
      const cardField = new Field(data);
      cardField.type = FieldType.Linked;
      cardField.linkedId = CardLinkedId.Number;
      expect(cardField.toSdkField().linkedId).toBe(305);

      // Test Identity LinkedId
      const identityField = new Field(data);
      identityField.type = FieldType.Linked;
      identityField.linkedId = IdentityLinkedId.LicenseNumber;
      expect(identityField.toSdkField().linkedId).toBe(415);
    });

    it("should map from SDK Field", () => {
      // Test Login LinkedId
      const loginField: SdkField = {
        name: undefined,
        value: undefined,
        type: FieldType.Linked,
        linkedId: LoginLinkedIdType.Username,
      };
      expect(Field.fromSdkField(loginField)!.linkedId).toBe(100);

      // Test Card LinkedId
      const cardField: SdkField = {
        name: undefined,
        value: undefined,
        type: FieldType.Linked,
        linkedId: CardLinkedIdType.Number,
      };
      expect(Field.fromSdkField(cardField)!.linkedId).toBe(305);

      // Test Identity LinkedId
      const identityFieldSdkField: SdkField = {
        name: undefined,
        value: undefined,
        type: FieldType.Linked,
        linkedId: IdentityLinkedIdType.LicenseNumber,
      };
      expect(Field.fromSdkField(identityFieldSdkField)!.linkedId).toBe(415);
    });
  });
});
