import { animate, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";

import { UserVerificationComponent as BaseComponent } from "@bitwarden/angular/auth/components/user-verification.component";
import { JslibModule } from "@bitwarden/angular/jslib.module";
import { FormFieldModule } from "@bitwarden/components";

/**
 * @deprecated Jan 24, 2024: Use new libs/auth UserVerificationDialogComponent or UserVerificationFormInputComponent instead.
 * Each client specific component should eventually be converted over to use one of these new components.
 */
@Component({
  selector: "app-user-verification",
  imports: [CommonModule, JslibModule, ReactiveFormsModule, FormFieldModule, FormsModule],
  templateUrl: "user-verification.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: UserVerificationComponent,
    },
  ],
  animations: [
    trigger("sent", [
      transition(":enter", [style({ opacity: 0 }), animate("100ms", style({ opacity: 1 }))]),
    ]),
  ],
})
export class UserVerificationComponent extends BaseComponent {}
