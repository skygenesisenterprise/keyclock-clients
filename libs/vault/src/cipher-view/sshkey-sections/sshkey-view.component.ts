// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { SshKeyView } from "@bitwarden/common/vault/models/view/ssh-key.view";
import {
  SectionHeaderComponent,
  TypographyModule,
  FormFieldModule,
  IconButtonModule,
} from "@bitwarden/components";

import { ReadOnlyCipherCardComponent } from "../read-only-cipher-card/read-only-cipher-card.component";

@Component({
  selector: "app-sshkey-view",
  templateUrl: "sshkey-view.component.html",
  imports: [
    CommonModule,
    JslibModule,
    SectionHeaderComponent,
    ReadOnlyCipherCardComponent,
    TypographyModule,
    FormFieldModule,
    IconButtonModule,
  ],
})
export class SshKeyViewComponent implements OnChanges {
  @Input() sshKey: SshKeyView;

  revealSshKey = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["sshKey"]) {
      this.revealSshKey = false;
    }
  }
}
