import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { SideNavService } from "./side-nav.service";

@Component({
  selector: "bit-nav-divider",
  templateUrl: "./nav-divider.component.html",
  imports: [CommonModule],
})
export class NavDividerComponent {
  constructor(protected sideNavService: SideNavService) {}
}
