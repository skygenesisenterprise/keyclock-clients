// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CdkStepper } from "@angular/cdk/stepper";
import { Component, Input, QueryList } from "@angular/core";

import { VerticalStep } from "./vertical-step.component";

@Component({
  selector: "app-vertical-stepper",
  templateUrl: "vertical-stepper.component.html",
  providers: [{ provide: CdkStepper, useExisting: VerticalStepperComponent }],
  standalone: false,
})
export class VerticalStepperComponent extends CdkStepper {
  readonly steps: QueryList<VerticalStep>;

  @Input()
  activeClass = "active";

  isNextButtonHidden() {
    return !(this.steps.length === this.selectedIndex + 1);
  }

  isStepDisabled(index: number) {
    if (this.selectedIndex !== index) {
      return this.selectedIndex === index - 1
        ? !this.steps.find((_, i) => i == index - 1)?.completed
        : true;
    }
    return false;
  }

  selectStepByIndex(index: number): void {
    this.selectedIndex = index;
  }
}
