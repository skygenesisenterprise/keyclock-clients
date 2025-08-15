// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { DialogService } from "@bitwarden/components";
import { SendFormConfig } from "@bitwarden/send-ui";

import { FilePopoutUtilsService } from "../../services/file-popout-utils.service";

import { SendFilePopoutDialogComponent } from "./send-file-popout-dialog.component";

@Component({
  selector: "send-file-popout-dialog-container",
  templateUrl: "./send-file-popout-dialog-container.component.html",
  imports: [JslibModule, CommonModule],
})
export class SendFilePopoutDialogContainerComponent implements OnInit {
  @Input() config: SendFormConfig;

  constructor(
    private dialogService: DialogService,
    private filePopoutUtilsService: FilePopoutUtilsService,
  ) {}

  ngOnInit() {
    if (
      this.config?.sendType === SendType.File &&
      this.config?.mode === "add" &&
      this.filePopoutUtilsService.showFilePopoutMessage(window)
    ) {
      this.dialogService.open(SendFilePopoutDialogComponent);
    }
  }
}
