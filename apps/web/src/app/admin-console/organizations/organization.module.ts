import { ScrollingModule } from "@angular/cdk/scrolling";
import { NgModule } from "@angular/core";

import { ScrollLayoutDirective } from "@bitwarden/components";

import { LooseComponentsModule } from "../../shared";

import { CoreOrganizationModule } from "./core";
import { GroupAddEditComponent } from "./manage/group-add-edit.component";
import { GroupsComponent } from "./manage/groups.component";
import { OrganizationsRoutingModule } from "./organization-routing.module";
import { SharedOrganizationModule } from "./shared";
import { AccessSelectorModule } from "./shared/components/access-selector";

@NgModule({
  imports: [
    SharedOrganizationModule,
    AccessSelectorModule,
    CoreOrganizationModule,
    OrganizationsRoutingModule,
    LooseComponentsModule,
    ScrollingModule,
    ScrollLayoutDirective,
  ],
  declarations: [GroupsComponent, GroupAddEditComponent],
})
export class OrganizationModule {}
