import { ScrollingModule } from "@angular/cdk/scrolling";
import { NgModule } from "@angular/core";

import { PasswordStrengthV2Component } from "@bitwarden/angular/tools/password-strength/password-strength-v2.component";
import { PasswordCalloutComponent } from "@bitwarden/auth/angular";
import { ScrollLayoutDirective } from "@bitwarden/components";

import { OrganizationFreeTrialWarningComponent } from "../../../billing/warnings/components";
import { LooseComponentsModule } from "../../../shared";
import { SharedOrganizationModule } from "../shared";

import { BulkConfirmDialogComponent } from "./components/bulk/bulk-confirm-dialog.component";
import { BulkDeleteDialogComponent } from "./components/bulk/bulk-delete-dialog.component";
import { BulkEnableSecretsManagerDialogComponent } from "./components/bulk/bulk-enable-sm-dialog.component";
import { BulkRemoveDialogComponent } from "./components/bulk/bulk-remove-dialog.component";
import { BulkRestoreRevokeComponent } from "./components/bulk/bulk-restore-revoke.component";
import { BulkStatusComponent } from "./components/bulk/bulk-status.component";
import { UserDialogModule } from "./components/member-dialog";
import { MembersRoutingModule } from "./members-routing.module";
import { MembersComponent } from "./members.component";

@NgModule({
  imports: [
    SharedOrganizationModule,
    LooseComponentsModule,
    MembersRoutingModule,
    UserDialogModule,
    PasswordCalloutComponent,
    ScrollingModule,
    PasswordStrengthV2Component,
    ScrollLayoutDirective,
    OrganizationFreeTrialWarningComponent,
  ],
  declarations: [
    BulkConfirmDialogComponent,
    BulkEnableSecretsManagerDialogComponent,
    BulkRemoveDialogComponent,
    BulkRestoreRevokeComponent,
    BulkStatusComponent,
    MembersComponent,
    BulkDeleteDialogComponent,
  ],
})
export class MembersModule {}
