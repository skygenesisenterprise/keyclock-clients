// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { NgClass } from "@angular/common";
import { Component, computed, ElementRef, HostBinding, input, model } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { debounce, interval } from "rxjs";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";
import { FocusableElement } from "../shared/focusable-element";

export type IconButtonType = "primary" | "danger" | "contrast" | "main" | "muted" | "nav-contrast";

const focusRing = [
  // Workaround for box-shadow with transparent offset issue:
  // https://github.com/tailwindlabs/tailwindcss/issues/3595
  // Remove `before:` and use regular `tw-ring` when browser no longer has bug, or better:
  // switch to `outline` with `outline-offset` when Safari supports border radius on outline.
  // Using `box-shadow` to create outlines is a hack and as such `outline` should be preferred.
  "tw-relative",
  "before:tw-content-['']",
  "before:tw-block",
  "before:tw-absolute",
  "before:-tw-inset-[1px]",
  "before:tw-rounded-lg",
  "before:tw-transition",
  "before:tw-ring-2",
  "before:tw-ring-transparent",
  "focus-visible:tw-z-10",
];

const styles: Record<IconButtonType, string[]> = {
  contrast: [
    "!tw-text-contrast",
    "tw-border-transparent",
    "hover:!tw-bg-hover-contrast",
    "focus-visible:before:tw-ring-text-contrast",
    ...focusRing,
  ],
  main: ["!tw-text-main", "focus-visible:before:tw-ring-primary-600", ...focusRing],
  muted: [
    "!tw-text-muted",
    "tw-border-transparent",
    "aria-expanded:tw-bg-text-muted",
    "aria-expanded:!tw-text-contrast",
    "focus-visible:before:tw-ring-primary-600",
    "aria-expanded:hover:tw-bg-secondary-700",
    "aria-expanded:hover:tw-border-secondary-700",
    ...focusRing,
  ],
  primary: ["!tw-text-primary-600", "focus-visible:before:tw-ring-primary-600", ...focusRing],
  danger: ["!tw-text-danger-600", "focus-visible:before:tw-ring-primary-600", ...focusRing],
  "nav-contrast": [
    "!tw-text-alt2",
    "hover:!tw-bg-hover-contrast",
    "focus-visible:before:tw-ring-text-alt2",
    ...focusRing,
  ],
};

export type IconButtonSize = "default" | "small";

const sizes: Record<IconButtonSize, string[]> = {
  default: ["tw-text-xl", "tw-p-2.5", "tw-rounded-md"],
  small: ["tw-text-base", "tw-p-2", "tw-rounded"],
};
/**
  * Icon buttons are used when no text accompanies the button. It consists of an icon that may be updated to any icon in the `bwi-font`, a `title` attribute, and an `aria-label`.

  * The most common use of the icon button is in the banner, toast, and modal components as a close button. It can also be found in tables as the 3 dot option menu, or on navigation list items when there are options that need to be collapsed into a menu.

  * Similar to the main button components, spacing between multiple icon buttons should be .5rem.
 */
@Component({
  selector: "button[bitIconButton]:not(button[bitButton])",
  templateUrl: "icon-button.component.html",
  providers: [
    { provide: ButtonLikeAbstraction, useExisting: BitIconButtonComponent },
    { provide: FocusableElement, useExisting: BitIconButtonComponent },
  ],
  imports: [NgClass],
  host: {
    "[attr.disabled]": "disabledAttr()",
    /**
     * When the `bitIconButton` input is dynamic from a consumer, Angular doesn't put the
     * `bitIconButton` attribute into the DOM. We use the attribute as a css selector in
     * a number of components, so this manual attr binding makes sure that the css selector
     * works when the input is dynamic.
     */
    "[attr.bitIconButton]": "icon()",
  },
})
export class BitIconButtonComponent implements ButtonLikeAbstraction, FocusableElement {
  readonly icon = model<string>(undefined, { alias: "bitIconButton" });

  readonly buttonType = input<IconButtonType>("main");

  readonly size = model<IconButtonSize>("default");

  @HostBinding("class") get classList() {
    return [
      "tw-font-semibold",
      "tw-leading-[0px]",
      "tw-border-none",
      "tw-transition",
      "tw-bg-transparent",
      "hover:tw-no-underline",
      "hover:tw-bg-hover-default",
      "focus:tw-outline-none",
    ]
      .concat(styles[this.buttonType()])
      .concat(sizes[this.size()])
      .concat(
        this.showDisabledStyles() || this.disabled()
          ? ["disabled:tw-opacity-60", "disabled:hover:!tw-bg-transparent"]
          : [],
      );
  }

  get iconClass() {
    return [this.icon(), "!tw-m-0"];
  }

  protected disabledAttr = computed(() => {
    const disabled = this.disabled() != null && this.disabled() !== false;
    return disabled || this.loading() ? true : null;
  });

  /**
   * Determine whether it is appropriate to display the disabled styles. We only want to show
   * the disabled styles if the button is truly disabled, or if the loading styles are also
   * visible.
   *
   * We can't use `disabledAttr` for this, because it returns `true` when `loading` is `true`.
   * We only want to show disabled styles during loading if `showLoadingStyles` is `true`.
   */
  protected showDisabledStyles = computed(() => {
    return this.showLoadingStyle() || (this.disabledAttr() && this.loading() === false);
  });

  readonly loading = model(false);

  /**
   * Determine whether it is appropriate to display a loading spinner. We only want to show
   * a spinner if it's been more than 75 ms since the `loading` state began. This prevents
   * a spinner "flash" for actions that are synchronous/nearly synchronous.
   *
   * We can't use `loading` for this, because we still need to disable the button during
   * the full `loading` state. I.e. we only want the spinner to be debounced, not the
   * loading state.
   *
   * This pattern of converting a signal to an observable and back to a signal is not
   * recommended. TODO -- find better way to use debounce with signals (CL-596)
   */
  protected showLoadingStyle = toSignal(
    toObservable(this.loading).pipe(debounce((isLoading) => interval(isLoading ? 75 : 0))),
  );

  readonly disabled = model<boolean>(false);

  getFocusTarget() {
    return this.elementRef.nativeElement;
  }

  constructor(private elementRef: ElementRef) {}
}
