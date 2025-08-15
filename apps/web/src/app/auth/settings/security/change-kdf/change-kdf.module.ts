import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../../../shared";

import { ChangeKdfConfirmationComponent } from "./change-kdf-confirmation.component";
import { ChangeKdfComponent } from "./change-kdf.component";

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [ChangeKdfComponent, ChangeKdfConfirmationComponent],
  exports: [ChangeKdfComponent, ChangeKdfConfirmationComponent],
})
export class ChangeKdfModule {}
