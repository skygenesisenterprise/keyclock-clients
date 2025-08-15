import * as sdk from "@bitwarden/sdk-internal";
import * as bitwardenModule from "@bitwarden/sdk-internal/bitwarden_wasm_internal_bg.wasm";

import { SdkLoadService } from "../../abstractions/sdk/sdk-load.service";

/**
 * Directly imports the Bitwarden SDK and initializes it.
 *
 * **Warning**: This requires WASM support and will fail if the environment does not support it.
 */
export class DefaultSdkLoadService extends SdkLoadService {
  async load(): Promise<void> {
    (sdk as any).init(bitwardenModule);
  }
}
