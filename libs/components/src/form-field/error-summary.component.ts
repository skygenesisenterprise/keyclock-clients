// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore

import { Component, input } from "@angular/core";
import { AbstractControl, UntypedFormGroup } from "@angular/forms";

import { I18nPipe } from "@bitwarden/ui-common";

@Component({
  selector: "bit-error-summary",
  template: ` @if (errorCount > 0) {
    <i class="bwi bwi-error"></i> {{ "fieldsNeedAttention" | i18n: errorString }}
  }`,
  host: {
    class: "tw-block tw-text-danger tw-mt-2",
    "aria-live": "assertive",
  },
  imports: [I18nPipe],
})
export class BitErrorSummary {
  readonly formGroup = input<UntypedFormGroup>();

  get errorCount(): number {
    return this.getErrorCount(this.formGroup());
  }

  get errorString() {
    return this.errorCount.toString();
  }

  private getErrorCount(form: UntypedFormGroup): number {
    return Object.values(form.controls).reduce((acc: number, control: AbstractControl) => {
      if (control instanceof UntypedFormGroup) {
        return acc + this.getErrorCount(control);
      }

      if (control.errors == null) {
        return acc;
      }

      if (!control.dirty && control.untouched) {
        return acc;
      }

      return acc + Object.keys(control.errors).length;
    }, 0);
  }
}
