import { Component } from "@angular/core";
import { Observable } from "rxjs";

import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";

import { BasePolicy, BasePolicyComponent } from "./base-policy.component";

export class RestrictedItemTypesPolicy extends BasePolicy {
  name = "restrictedItemTypePolicy";
  description = "restrictedItemTypePolicyDesc";
  type = PolicyType.RestrictedItemTypes;
  component = RestrictedItemTypesPolicyComponent;

  display(organization: Organization, configService: ConfigService): Observable<boolean> {
    return configService.getFeatureFlag$(FeatureFlag.RemoveCardItemTypePolicy);
  }
}

@Component({
  selector: "policy-restricted-item-types",
  templateUrl: "restricted-item-types.component.html",
  standalone: false,
})
export class RestrictedItemTypesPolicyComponent extends BasePolicyComponent {
  constructor() {
    super();
  }
}
