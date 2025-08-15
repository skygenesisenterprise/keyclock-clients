import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../../shared/shared.module";

import { ReportCardComponent } from "./report-card/report-card.component";
import { ReportListComponent } from "./report-list/report-list.component";

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [ReportCardComponent, ReportListComponent],
  exports: [ReportCardComponent, ReportListComponent],
})
export class ReportsSharedModule {}
