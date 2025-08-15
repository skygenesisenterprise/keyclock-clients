// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Component, Inject } from "@angular/core";

import {
  OrganizationUserBulkPublicKeyResponse,
  OrganizationUserBulkResponse,
} from "@bitwarden/admin-console/common";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderUserStatusType } from "@bitwarden/common/admin-console/enums";
import { ProviderUserBulkConfirmRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk-confirm.request";
import { ProviderUserBulkRequest } from "@bitwarden/common/admin-console/models/request/provider/provider-user-bulk.request";
import { ProviderUserBulkPublicKeyResponse } from "@bitwarden/common/admin-console/models/response/provider/provider-user-bulk-public-key.response";
import { ProviderUserBulkResponse } from "@bitwarden/common/admin-console/models/response/provider/provider-user-bulk.response";
import { EncryptService } from "@bitwarden/common/key-management/crypto/abstractions/encrypt.service";
import { ListResponse } from "@bitwarden/common/models/response/list.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { DIALOG_DATA, DialogConfig, DialogService } from "@bitwarden/components";
import { KeyService } from "@bitwarden/key-management";
import { BaseBulkConfirmComponent } from "@bitwarden/web-vault/app/admin-console/organizations/members/components/bulk/base-bulk-confirm.component";
import { BulkUserDetails } from "@bitwarden/web-vault/app/admin-console/organizations/members/components/bulk/bulk-status.component";

type BulkConfirmDialogParams = {
  providerId: string;
  users: BulkUserDetails[];
};

@Component({
  templateUrl:
    "../../../../../../../../apps/web/src/app/admin-console/organizations/members/components/bulk/bulk-confirm-dialog.component.html",
  standalone: false,
})
export class BulkConfirmDialogComponent extends BaseBulkConfirmComponent {
  providerId: string;

  constructor(
    private apiService: ApiService,
    protected keyService: KeyService,
    protected encryptService: EncryptService,
    @Inject(DIALOG_DATA) protected dialogParams: BulkConfirmDialogParams,
    protected i18nService: I18nService,
  ) {
    super(keyService, encryptService, i18nService);

    this.providerId = dialogParams.providerId;
    this.users = dialogParams.users;
  }

  protected getCryptoKey = (): Promise<SymmetricCryptoKey> =>
    this.keyService.getProviderKey(this.providerId);

  protected getPublicKeys = async (): Promise<
    ListResponse<OrganizationUserBulkPublicKeyResponse | ProviderUserBulkPublicKeyResponse>
  > => {
    const request = new ProviderUserBulkRequest(this.filteredUsers.map((user) => user.id));
    return await this.apiService.postProviderUsersPublicKey(this.providerId, request);
  };

  protected isAccepted = (user: BulkUserDetails): boolean =>
    user.status === ProviderUserStatusType.Accepted;

  protected postConfirmRequest = async (
    userIdsWithKeys: { id: string; key: string }[],
  ): Promise<ListResponse<OrganizationUserBulkResponse | ProviderUserBulkResponse>> => {
    const request = new ProviderUserBulkConfirmRequest(userIdsWithKeys);
    return await this.apiService.postProviderUserBulkConfirm(this.providerId, request);
  };

  static open(dialogService: DialogService, dialogConfig: DialogConfig<BulkConfirmDialogParams>) {
    return dialogService.open(BulkConfirmDialogComponent, dialogConfig);
  }
}
