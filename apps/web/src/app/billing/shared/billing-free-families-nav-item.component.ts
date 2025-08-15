import { Component } from "@angular/core";
import { Observable } from "rxjs";

import { NavigationModule } from "@bitwarden/components";

import { FreeFamiliesPolicyService } from "../services/free-families-policy.service";

import { BillingSharedModule } from "./billing-shared.module";

@Component({
  selector: "billing-free-families-nav-item",
  templateUrl: "./billing-free-families-nav-item.component.html",
  imports: [NavigationModule, BillingSharedModule],
})
export class BillingFreeFamiliesNavItemComponent {
  showFreeFamilies$: Observable<boolean>;

  constructor(private freeFamiliesPolicyService: FreeFamiliesPolicyService) {
    this.showFreeFamilies$ = this.freeFamiliesPolicyService.showFreeFamilies$;
  }
}
