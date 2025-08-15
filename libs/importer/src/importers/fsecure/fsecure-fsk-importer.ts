// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CipherType } from "@bitwarden/common/vault/enums";
import { CardView } from "@bitwarden/common/vault/models/view/card.view";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { ImportResult } from "../../models/import-result";
import { BaseImporter } from "../base-importer";
import { Importer } from "../importer";

import { FskEntry, FskEntryTypesEnum, FskFile } from "./fsecure-fsk-types";

export class FSecureFskImporter extends BaseImporter implements Importer {
  parse(data: string): Promise<ImportResult> {
    const result = new ImportResult();
    const results: FskFile = JSON.parse(data);
    if (results == null || results.data == null) {
      result.success = false;
      return Promise.resolve(result);
    }

    for (const key in results.data) {
      // eslint-disable-next-line
      if (!results.data.hasOwnProperty(key)) {
        continue;
      }

      const value = results.data[key];
      const cipher = this.parseEntry(value);
      result.ciphers.push(cipher);
    }

    result.success = true;
    return Promise.resolve(result);
  }

  private parseEntry(entry: FskEntry): CipherView {
    const cipher = this.initLoginCipher();
    cipher.name = this.getValueOrDefault(entry.service);
    cipher.notes = this.getValueOrDefault(entry.notes);
    cipher.favorite = entry.favorite > 0;

    switch (entry.type) {
      case FskEntryTypesEnum.Login:
        this.handleLoginEntry(entry, cipher);
        break;
      case FskEntryTypesEnum.CreditCard:
        this.handleCreditCardEntry(entry, cipher);
        break;
      default:
        return;
        break;
    }

    this.convertToNoteIfNeeded(cipher);
    this.cleanupCipher(cipher);
    return cipher;
  }

  private handleLoginEntry(entry: FskEntry, cipher: CipherView) {
    cipher.login.username = this.getValueOrDefault(entry.username);
    cipher.login.password = this.getValueOrDefault(entry.password);
    cipher.login.uris = this.makeUriArray(entry.url);
  }

  private handleCreditCardEntry(entry: FskEntry, cipher: CipherView) {
    cipher.type = CipherType.Card;
    cipher.card = new CardView();
    cipher.card.cardholderName = this.getValueOrDefault(entry.username);
    cipher.card.number = this.getValueOrDefault(entry.creditNumber);
    cipher.card.brand = CardView.getCardBrandByPatterns(cipher.card.number);
    cipher.card.code = this.getValueOrDefault(entry.creditCvv);
    if (!this.isNullOrWhitespace(entry.creditExpiry)) {
      if (!this.setCardExpiration(cipher, entry.creditExpiry)) {
        this.processKvp(cipher, "Expiration", entry.creditExpiry);
      }
    }
    if (!this.isNullOrWhitespace(entry.password)) {
      this.processKvp(cipher, "PIN", entry.password);
    }
  }
}
