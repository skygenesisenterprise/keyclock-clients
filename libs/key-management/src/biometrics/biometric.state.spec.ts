import { KeyDefinition, UserKeyDefinition } from "@bitwarden/common/platform/state";

import {
  BIOMETRIC_UNLOCK_ENABLED,
  DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT,
  ENCRYPTED_CLIENT_KEY_HALF,
  FINGERPRINT_VALIDATED,
  PROMPT_AUTOMATICALLY,
  PROMPT_CANCELLED,
  REQUIRE_PASSWORD_ON_START,
} from "./biometric.state";

describe.each([
  [ENCRYPTED_CLIENT_KEY_HALF, "encryptedClientKeyHalf"],
  [DISMISSED_REQUIRE_PASSWORD_ON_START_CALLOUT, true],
  [PROMPT_CANCELLED, { userId1: true, userId2: false }],
  [PROMPT_AUTOMATICALLY, true],
  [REQUIRE_PASSWORD_ON_START, true],
  [BIOMETRIC_UNLOCK_ENABLED, true],
  [FINGERPRINT_VALIDATED, true],
])(
  "deserializes state %s",
  (...args: [UserKeyDefinition<unknown> | KeyDefinition<unknown>, unknown]) => {
    function testDeserialization<T>(
      keyDefinition: UserKeyDefinition<T> | KeyDefinition<T>,
      state: T,
    ) {
      const deserialized = keyDefinition.deserializer(JSON.parse(JSON.stringify(state)));
      expect(deserialized).toEqual(state);
    }

    it("should deserialize state", () => {
      const [keyDefinition, state] = args;
      testDeserialization(keyDefinition, state);
    });
  },
);
