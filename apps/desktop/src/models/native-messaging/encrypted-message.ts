import { EncString } from "@bitwarden/common/key-management/crypto/models/enc-string";

import { MessageCommon } from "./message-common";

export type EncryptedMessage = MessageCommon & {
  // Will decrypt to a DecryptedCommandData object
  encryptedCommand: EncString;
};
