import {
  CbcDecryptParameters,
  EcbDecryptParameters,
} from "../../../platform/models/domain/decrypt-parameters";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { CsprngArray } from "../../../types/csprng";

export abstract class CryptoFunctionService {
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract pbkdf2(
    password: string | Uint8Array,
    salt: string | Uint8Array,
    algorithm: "sha256" | "sha512",
    iterations: number,
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract hkdf(
    ikm: Uint8Array,
    salt: string | Uint8Array,
    info: string | Uint8Array,
    outputByteSize: number,
    algorithm: "sha256" | "sha512",
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract hkdfExpand(
    prk: Uint8Array,
    info: string | Uint8Array,
    outputByteSize: number,
    algorithm: "sha256" | "sha512",
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract hash(
    value: string | Uint8Array,
    algorithm: "sha1" | "sha256" | "sha512" | "md5",
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract hmacFast(
    value: Uint8Array | string,
    key: Uint8Array | string,
    algorithm: "sha1" | "sha256" | "sha512",
  ): Promise<Uint8Array | string>;
  abstract compareFast(a: Uint8Array | string, b: Uint8Array | string): Promise<boolean>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract aesDecryptFastParameters(
    data: string,
    iv: string,
    mac: string,
    key: SymmetricCryptoKey,
  ): CbcDecryptParameters<Uint8Array | string>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract aesDecryptFast({
    mode,
    parameters,
  }:
    | { mode: "cbc"; parameters: CbcDecryptParameters<Uint8Array | string> }
    | { mode: "ecb"; parameters: EcbDecryptParameters<Uint8Array | string> }): Promise<string>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Only used by DDG integration until DDG uses PKCS#7 padding, and by lastpass importer.
   */
  abstract aesDecrypt(
    data: Uint8Array,
    iv: Uint8Array,
    key: Uint8Array,
    mode: "cbc" | "ecb",
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract rsaEncrypt(
    data: Uint8Array,
    publicKey: Uint8Array,
    algorithm: "sha1" | "sha256",
  ): Promise<Uint8Array>;
  /**
   * @deprecated HAZMAT WARNING: DO NOT USE THIS FOR NEW CODE. Implement low-level crypto operations
   * in the SDK instead. Further, you should probably never find yourself using this low-level crypto function.
   */
  abstract rsaDecrypt(
    data: Uint8Array,
    privateKey: Uint8Array,
    algorithm: "sha1" | "sha256",
  ): Promise<Uint8Array>;
  abstract rsaExtractPublicKey(privateKey: Uint8Array): Promise<Uint8Array>;
  abstract rsaGenerateKeyPair(length: 1024 | 2048 | 4096): Promise<[Uint8Array, Uint8Array]>;
  /**
   * Generates a key of the given length suitable for use in AES encryption
   */
  abstract aesGenerateKey(bitLength: 128 | 192 | 256 | 512): Promise<CsprngArray>;
  /**
   * Generates a random array of bytes of the given length. Uses a cryptographically secure random number generator.
   * Do not use this for generating encryption keys. Use aesGenerateKey or rsaGenerateKeyPair instead.
   */
  abstract randomBytes(length: number): Promise<CsprngArray>;
}
