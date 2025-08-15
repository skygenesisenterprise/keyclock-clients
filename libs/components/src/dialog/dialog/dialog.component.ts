import { CdkTrapFocus } from "@angular/cdk/a11y";
import { CdkScrollable } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import {
  Component,
  HostBinding,
  inject,
  viewChild,
  input,
  booleanAttribute,
  AfterViewInit,
} from "@angular/core";

import { I18nPipe } from "@bitwarden/ui-common";

import { BitIconButtonComponent } from "../../icon-button/icon-button.component";
import { TypographyDirective } from "../../typography/typography.directive";
import { hasScrolledFrom } from "../../utils/has-scrolled-from";
import { fadeIn } from "../animations";
import { DialogRef } from "../dialog.service";
import { DialogCloseDirective } from "../directives/dialog-close.directive";
import { DialogTitleContainerDirective } from "../directives/dialog-title-container.directive";

@Component({
  selector: "bit-dialog",
  templateUrl: "./dialog.component.html",
  animations: [fadeIn],
  host: {
    "(keydown.esc)": "handleEsc($event)",
  },
  imports: [
    CommonModule,
    DialogTitleContainerDirective,
    TypographyDirective,
    BitIconButtonComponent,
    DialogCloseDirective,
    I18nPipe,
    CdkTrapFocus,
    CdkScrollable,
  ],
})
export class DialogComponent implements AfterViewInit {
  protected dialogRef = inject(DialogRef, { optional: true });
  private scrollableBody = viewChild.required(CdkScrollable);
  protected bodyHasScrolledFrom = hasScrolledFrom(this.scrollableBody);
  protected isScrollable = false;

  /** Background color */
  readonly background = input<"default" | "alt">("default");

  /**
   * Dialog size, more complex dialogs should use large, otherwise default is fine.
   */
  readonly dialogSize = input<"small" | "default" | "large">("default");

  /**
   * Title to show in the dialog's header
   */
  readonly title = input<string>();

  /**
   * Subtitle to show in the dialog's header
   */
  readonly subtitle = input<string>();

  /**
   * Disable the built-in padding on the dialog, for use with tabbed dialogs.
   */
  readonly disablePadding = input(false, { transform: booleanAttribute });

  /**
   * Mark the dialog as loading which replaces the content with a spinner.
   */
  readonly loading = input(false);

  @HostBinding("class") get classes() {
    // `tw-max-h-[90vh]` is needed to prevent dialogs from overlapping the desktop header
    return ["tw-flex", "tw-flex-col", "tw-w-screen"]
      .concat(
        this.width,
        this.dialogRef?.isDrawer
          ? ["tw-min-h-screen", "md:tw-w-[23rem]"]
          : ["tw-p-4", "tw-w-screen", "tw-max-h-[90vh]"],
      )
      .flat();
  }

  handleEsc(event: Event) {
    if (!this.dialogRef?.disableClose) {
      this.dialogRef?.close();
      event.stopPropagation();
    }
  }

  get width() {
    switch (this.dialogSize()) {
      case "small": {
        return "md:tw-max-w-sm";
      }
      case "large": {
        return "md:tw-max-w-3xl";
      }
      default: {
        return "md:tw-max-w-xl";
      }
    }
  }

  ngAfterViewInit() {
    this.isScrollable = this.canScroll();
  }

  canScroll(): boolean {
    const el = this.scrollableBody().getElementRef().nativeElement as HTMLElement;
    return el.scrollHeight > el.clientHeight;
  }
}
