import { Component } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { BadgeModule } from "@bitwarden/components";

@Component({
  selector: "app-premium-badge",
  template: `
    <button type="button" *appNotPremium bitBadge variant="success" (click)="premiumRequired()">
      {{ "premium" | i18n }}
    </button>
  `,
  imports: [JslibModule, BadgeModule],
})
export class PremiumBadgeComponent {
  constructor(private messagingService: MessagingService) {}

  premiumRequired() {
    this.messagingService.send("premiumRequired");
  }
}
