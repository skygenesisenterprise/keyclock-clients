import { Component } from "@angular/core";
import { map, Observable } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";

import { BasePolicy, BasePolicyComponent } from "./base-policy.component";

export class OrganizationDataOwnershipPolicy extends BasePolicy {
  name = "organizationDataOwnership";
  description = "personalOwnershipPolicyDesc";
  type = PolicyType.OrganizationDataOwnership;
  component = OrganizationDataOwnershipPolicyComponent;

  display(organization: Organization, configService: ConfigService): Observable<boolean> {
    return configService
      .getFeatureFlag$(FeatureFlag.CreateDefaultLocation)
      .pipe(map((enabled) => !enabled));
  }
}

@Component({
  selector: "policy-organization-data-ownership",
  templateUrl: "organization-data-ownership.component.html",
  standalone: false,
})
export class OrganizationDataOwnershipPolicyComponent extends BasePolicyComponent {}
