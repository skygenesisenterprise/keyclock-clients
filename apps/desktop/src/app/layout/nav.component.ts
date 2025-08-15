import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

@Component({
  selector: "app-nav",
  templateUrl: "nav.component.html",
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class NavComponent {
  items: any[] = [
    {
      link: "/vault",
      icon: "bwi-vault",
      label: this.i18nService.translate("myVault"),
    },
    {
      link: "/send",
      icon: "bwi-send",
      label: "Send",
    },
  ];

  constructor(private i18nService: I18nService) {}
}
