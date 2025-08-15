import { Component } from "@angular/core";
import { combineLatest, map, Observable, startWith, switchMap } from "rxjs";

import { NudgesService } from "@bitwarden/angular/vault";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { Icons } from "@bitwarden/components";

import { NavButton } from "../platform/popup/layout/popup-tab-navigation.component";

@Component({
  selector: "app-tabs-v2",
  templateUrl: "./tabs-v2.component.html",
  standalone: false,
})
export class TabsV2Component {
  private hasActiveBadges$ = this.accountService.activeAccount$
    .pipe(getUserId)
    .pipe(switchMap((userId) => this.nudgesService.hasActiveBadges$(userId)));
  protected navButtons$: Observable<NavButton[]> = combineLatest([
    this.configService.getFeatureFlag$(FeatureFlag.PM8851_BrowserOnboardingNudge),
    this.hasActiveBadges$,
  ]).pipe(
    startWith([false, false]),
    map(([onboardingFeatureEnabled, hasBadges]) => {
      return [
        {
          label: "vault",
          page: "/tabs/vault",
          icon: Icons.VaultInactive,
          iconActive: Icons.VaultActive,
        },
        {
          label: "generator",
          page: "/tabs/generator",
          icon: Icons.GeneratorInactive,
          iconActive: Icons.GeneratorActive,
        },
        {
          label: "send",
          page: "/tabs/send",
          icon: Icons.SendInactive,
          iconActive: Icons.SendActive,
        },
        {
          label: "settings",
          page: "/tabs/settings",
          icon: Icons.SettingsInactive,
          iconActive: Icons.SettingsActive,
          showBerry: onboardingFeatureEnabled && hasBadges,
        },
      ];
    }),
  );
  constructor(
    private nudgesService: NudgesService,
    private accountService: AccountService,
    private readonly configService: ConfigService,
  ) {}
}
