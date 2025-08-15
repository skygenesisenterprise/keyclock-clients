import { Component, EventEmitter, Output, input } from "@angular/core";

import { IconButtonModule } from "../icon-button";
import { SharedModule } from "../shared";
import { TypographyModule } from "../typography";

export type ToastVariant = "success" | "error" | "info" | "warning";

const variants: Record<ToastVariant, { icon: string; bgColor: string }> = {
  success: {
    icon: "bwi-check-circle",
    bgColor: "tw-bg-success-100",
  },
  error: {
    icon: "bwi-error",
    bgColor: "tw-bg-danger-100",
  },
  info: {
    icon: "bwi-info-circle",
    bgColor: "tw-bg-info-100",
  },
  warning: {
    icon: "bwi-exclamation-triangle",
    bgColor: "tw-bg-warning-100",
  },
};

@Component({
  selector: "bit-toast",
  templateUrl: "toast.component.html",
  imports: [SharedModule, IconButtonModule, TypographyModule],
})
export class ToastComponent {
  readonly variant = input<ToastVariant>("info");

  /**
   * The message to display
   *
   * Pass an array to render multiple paragraphs.
   **/
  readonly message = input.required<string | string[]>();

  /** An optional title to display over the message. */
  readonly title = input<string>();

  /**
   * The percent width of the progress bar, from 0-100
   **/
  readonly progressWidth = input(0);

  /** Emits when the user presses the close button */
  @Output() onClose = new EventEmitter<void>();

  protected get iconClass(): string {
    return variants[this.variant()].icon;
  }

  protected get bgColor(): string {
    return variants[this.variant()].bgColor;
  }

  protected get messageArray(): string[] {
    const message = this.message();
    return Array.isArray(message) ? message : [message];
  }
}
