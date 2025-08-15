// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  BadgeModule,
  ButtonModule,
  IconButtonModule,
  ItemModule,
  TypographyModule,
} from "@bitwarden/components";

@Component({
  selector: "app-fido2-cipher-row",
  templateUrl: "fido2-cipher-row.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BadgeModule,
    ButtonModule,
    CommonModule,
    IconButtonModule,
    ItemModule,
    JslibModule,
    TypographyModule,
  ],
})
export class Fido2CipherRowComponent {
  @Output() onSelected = new EventEmitter<CipherView>();
  @Input() cipher: CipherView;
  @Input() last: boolean;
  @Input() title: string;

  protected selectCipher(c: CipherView) {
    this.onSelected.emit(c);
  }

  /**
   * Returns a subname for the cipher.
   * If this has a FIDO2 credential, and the cipher.name is different from the FIDO2 credential's rpId, return the rpId.
   * @param c Cipher
   * @returns
   */
  protected getSubName(c: CipherView): string | null {
    const fido2Credentials = c.login?.fido2Credentials;

    if (!fido2Credentials || fido2Credentials.length === 0) {
      return null;
    }

    const [fido2Credential] = fido2Credentials;

    return c.name !== fido2Credential.rpId ? fido2Credential.rpId : null;
  }
}
