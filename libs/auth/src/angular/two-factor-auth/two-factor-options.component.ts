import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import {
  TwoFactorProviderDetails,
  TwoFactorService,
} from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";
// This import has been flagged as unallowed for this class. It may be involved in a circular dependency loop.
// eslint-disable-next-line no-restricted-imports
import {
  DialogRef,
  ButtonModule,
  DialogModule,
  DialogService,
  IconModule,
  ItemModule,
  TypographyModule,
} from "@bitwarden/components";

import {
  TwoFactorAuthAuthenticatorIcon,
  TwoFactorAuthDuoIcon,
  TwoFactorAuthEmailIcon,
  TwoFactorAuthWebAuthnIcon,
  TwoFactorAuthYubicoIcon,
} from "../icons/two-factor-auth";

export type TwoFactorOptionsDialogResult = {
  type: TwoFactorProviderType;
};

@Component({
  selector: "app-two-factor-options",
  templateUrl: "two-factor-options.component.html",
  imports: [
    CommonModule,
    JslibModule,
    DialogModule,
    ButtonModule,
    TypographyModule,
    ItemModule,
    IconModule,
  ],
  providers: [],
})
export class TwoFactorOptionsComponent implements OnInit {
  providers: TwoFactorProviderDetails[] = [];
  TwoFactorProviderType = TwoFactorProviderType;

  readonly Icons = {
    TwoFactorAuthAuthenticatorIcon,
    TwoFactorAuthEmailIcon,
    TwoFactorAuthDuoIcon,
    TwoFactorAuthYubicoIcon,
    TwoFactorAuthWebAuthnIcon,
  };

  constructor(
    private twoFactorService: TwoFactorService,
    private dialogRef: DialogRef,
  ) {}

  async ngOnInit() {
    const providers = await this.twoFactorService.getSupportedProviders(window);
    providers.sort((a: TwoFactorProviderDetails, b: TwoFactorProviderDetails) => a.sort - b.sort);
    this.providers = providers;
  }

  async choose(p: TwoFactorProviderDetails) {
    this.dialogRef.close({ type: p.type });
  }

  static open(dialogService: DialogService) {
    return dialogService.open<TwoFactorOptionsDialogResult>(TwoFactorOptionsComponent);
  }

  cancel() {
    this.dialogRef.close();
  }
}
