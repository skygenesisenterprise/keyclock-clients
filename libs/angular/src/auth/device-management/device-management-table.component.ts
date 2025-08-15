import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { DevicePendingAuthRequest } from "@bitwarden/common/auth/abstractions/devices/responses/device.response";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import {
  BadgeModule,
  ButtonModule,
  LinkModule,
  TableDataSource,
  TableModule,
} from "@bitwarden/components";

import { DeviceDisplayData } from "./device-management.component";

/** Displays user devices in a sortable table view */
@Component({
  standalone: true,
  selector: "auth-device-management-table",
  templateUrl: "./device-management-table.component.html",
  imports: [BadgeModule, ButtonModule, CommonModule, JslibModule, LinkModule, TableModule],
})
export class DeviceManagementTableComponent implements OnChanges {
  @Input() devices: DeviceDisplayData[] = [];
  @Output() onAuthRequestAnswered = new EventEmitter<DevicePendingAuthRequest>();

  protected tableDataSource = new TableDataSource<DeviceDisplayData>();

  protected readonly columnConfig = [
    {
      name: "displayName",
      title: this.i18nService.t("device"),
      headerClass: "tw-w-1/3",
      sortable: true,
    },
    {
      name: "loginStatus",
      title: this.i18nService.t("loginStatus"),
      headerClass: "tw-w-1/3",
      sortable: true,
    },
    {
      name: "firstLogin",
      title: this.i18nService.t("firstLogin"),
      headerClass: "tw-w-1/3",
      sortable: true,
    },
  ];

  constructor(private i18nService: I18nService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.devices) {
      this.tableDataSource.data = this.devices;
    }
  }

  protected answerAuthRequest(pendingAuthRequest: DevicePendingAuthRequest | null) {
    if (pendingAuthRequest == null) {
      return;
    }
    this.onAuthRequestAnswered.emit(pendingAuthRequest);
  }
}
