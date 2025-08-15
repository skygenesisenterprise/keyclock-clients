// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Component, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { firstValueFrom } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { KdfRequest } from "@bitwarden/common/models/request/kdf.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { DIALOG_DATA, ToastService } from "@bitwarden/components";
import { KdfConfig, KdfType, KeyService } from "@bitwarden/key-management";

@Component({
  selector: "app-change-kdf-confirmation",
  templateUrl: "change-kdf-confirmation.component.html",
  standalone: false,
})
export class ChangeKdfConfirmationComponent {
  kdfConfig: KdfConfig;

  form = new FormGroup({
    masterPassword: new FormControl(null, Validators.required),
  });
  showPassword = false;
  masterPassword: string;
  loading = false;

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private keyService: KeyService,
    private messagingService: MessagingService,
    @Inject(DIALOG_DATA) params: { kdf: KdfType; kdfConfig: KdfConfig },
    private accountService: AccountService,
    private toastService: ToastService,
  ) {
    this.kdfConfig = params.kdfConfig;
    this.masterPassword = null;
  }

  submit = async () => {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    await this.makeKeyAndSaveAsync();
    this.toastService.showToast({
      variant: "success",
      title: this.i18nService.t("encKeySettingsChanged"),
      message: this.i18nService.t("logBackIn"),
    });
    this.messagingService.send("logout");
    this.loading = false;
  };

  private async makeKeyAndSaveAsync() {
    const activeAccount = await firstValueFrom(this.accountService.activeAccount$);
    if (activeAccount == null) {
      throw new Error("No active account found.");
    }
    const masterPassword = this.form.value.masterPassword;

    // Ensure the KDF config is valid.
    this.kdfConfig.validateKdfConfigForSetting();

    const request = new KdfRequest();
    request.kdf = this.kdfConfig.kdfType;
    request.kdfIterations = this.kdfConfig.iterations;
    if (this.kdfConfig.kdfType === KdfType.Argon2id) {
      request.kdfMemory = this.kdfConfig.memory;
      request.kdfParallelism = this.kdfConfig.parallelism;
    }
    const masterKey = await this.keyService.getOrDeriveMasterKey(masterPassword, activeAccount.id);
    request.masterPasswordHash = await this.keyService.hashMasterKey(masterPassword, masterKey);

    const newMasterKey = await this.keyService.makeMasterKey(
      masterPassword,
      activeAccount.email,
      this.kdfConfig,
    );
    request.newMasterPasswordHash = await this.keyService.hashMasterKey(
      masterPassword,
      newMasterKey,
    );
    const newUserKey = await this.keyService.encryptUserKeyWithMasterKey(newMasterKey);
    request.key = newUserKey[1].encryptedString;

    await this.apiService.postAccountKdf(request);
  }
}
