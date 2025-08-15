// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { TemplatePortal, CdkPortalOutlet } from "@angular/cdk/portal";
import { Component, effect, HostBinding, input } from "@angular/core";

@Component({
  selector: "bit-tab-body",
  templateUrl: "tab-body.component.html",
  imports: [CdkPortalOutlet],
})
export class TabBodyComponent {
  private _firstRender: boolean;

  readonly content = input<TemplatePortal>();
  readonly preserveContent = input(false);

  @HostBinding("attr.hidden") get hidden() {
    return !this.active() || null;
  }

  readonly active = input<boolean>();

  constructor() {
    effect(() => {
      if (this.active()) {
        this._firstRender = true;
      }
    });
  }

  /**
   * The tab content to render.
   * Inactive tabs that have never been rendered/active do not have their
   * content rendered by default for performance. If `preserveContent` is `true`
   * then the content persists after the first time content is rendered.
   */
  get tabContent() {
    if (this.active()) {
      return this.content();
    }
    if (this.preserveContent() && this._firstRender) {
      return this.content();
    }
    return null;
  }
}
