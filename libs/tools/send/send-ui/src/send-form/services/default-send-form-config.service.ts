// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { inject, Injectable } from "@angular/core";
import { combineLatest, firstValueFrom, map, switchMap } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { SendService } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { SendId } from "@bitwarden/common/types/guid";

import {
  SendFormConfig,
  SendFormConfigService,
  SendFormMode,
} from "../abstractions/send-form-config.service";

/**
 * Default implementation of the `SendFormConfigService`.
 */
@Injectable()
export class DefaultSendFormConfigService implements SendFormConfigService {
  private policyService: PolicyService = inject(PolicyService);
  private sendService: SendService = inject(SendService);
  private accountService: AccountService = inject(AccountService);

  async buildConfig(
    mode: SendFormMode,
    sendId?: SendId,
    sendType?: SendType,
  ): Promise<SendFormConfig> {
    const [areSendsAllowed, send] = await firstValueFrom(
      combineLatest([this.areSendsEnabled$, this.getSend(sendId)]),
    );

    return {
      mode,
      sendType: send?.type ?? sendType ?? SendType.Text,
      areSendsAllowed,
      originalSend: send,
    };
  }

  private areSendsEnabled$ = this.accountService.activeAccount$.pipe(
    getUserId,
    switchMap((userId) => this.policyService.policyAppliesToUser$(PolicyType.DisableSend, userId)),
    map((p) => !p),
  );

  private getSend(id?: SendId) {
    if (id == null) {
      return Promise.resolve(null);
    }
    return this.sendService.get$(id);
  }
}
