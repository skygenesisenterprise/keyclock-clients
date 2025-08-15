// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AccountApiService } from "@bitwarden/common/auth/abstractions/account-api.service";
import { RegisterSendVerificationEmailRequest } from "@bitwarden/common/auth/models/request/registration/register-send-verification-email.request";
import { RegionConfig, Region } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
// This import has been flagged as unallowed for this class. It may be involved in a circular dependency loop.
// eslint-disable-next-line no-restricted-imports
import {
  AnonLayoutWrapperDataService,
  AsyncActionsModule,
  ButtonModule,
  CheckboxModule,
  FormFieldModule,
  Icons,
  IconModule,
  LinkModule,
} from "@bitwarden/components";

import { LoginEmailService } from "../../../common";
import { RegistrationUserAddIcon } from "../../icons";
import { RegistrationEnvSelectorComponent } from "../registration-env-selector/registration-env-selector.component";

// FIXME: update to use a const object instead of a typescript enum
// eslint-disable-next-line @bitwarden/platform/no-enums
export enum RegistrationStartState {
  USER_DATA_ENTRY = "UserDataEntry",
  CHECK_EMAIL = "CheckEmail",
}

const DEFAULT_MARKETING_EMAILS_PREF_BY_REGION: Record<Region, boolean> = {
  [Region.US]: true,
  [Region.EU]: false,
  [Region.SelfHosted]: false,
};

@Component({
  selector: "auth-registration-start",
  templateUrl: "./registration-start.component.html",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    JslibModule,
    FormFieldModule,
    AsyncActionsModule,
    CheckboxModule,
    ButtonModule,
    LinkModule,
    IconModule,
    RegistrationEnvSelectorComponent,
  ],
})
export class RegistrationStartComponent implements OnInit, OnDestroy {
  @Output() registrationStartStateChange = new EventEmitter<RegistrationStartState>();

  state: RegistrationStartState = RegistrationStartState.USER_DATA_ENTRY;
  RegistrationStartState = RegistrationStartState;

  isSelfHost = false;

  formGroup = this.formBuilder.group({
    email: ["", [Validators.required, Validators.email]],
    name: [""],
    receiveMarketingEmails: [false],
  });

  get email() {
    return this.formGroup.controls.email;
  }

  get name() {
    return this.formGroup.controls.name;
  }

  get receiveMarketingEmails() {
    return this.formGroup.controls.receiveMarketingEmails;
  }

  emailReadonly: boolean = false;

  showErrorSummary = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private platformUtilsService: PlatformUtilsService,
    private accountApiService: AccountApiService,
    private router: Router,
    private loginEmailService: LoginEmailService,
    private anonLayoutWrapperDataService: AnonLayoutWrapperDataService,
  ) {
    this.isSelfHost = platformUtilsService.isSelfHost();
  }

  async ngOnInit() {
    // Emit the initial state
    this.registrationStartStateChange.emit(this.state);

    this.listenForQueryParamChanges();

    /**
     * If the user has a login email, set the email field to the login email.
     */
    this.loginEmailService.loginEmail$.pipe(takeUntil(this.destroy$)).subscribe((email) => {
      if (email) {
        this.formGroup.patchValue({ email });
      }
    });
  }

  private listenForQueryParamChanges() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((qParams) => {
      if (qParams.email != null && qParams.email.indexOf("@") > -1) {
        this.email?.setValue(qParams.email);
        this.emailReadonly = qParams.emailReadonly === "true";
      }
    });
  }

  setReceiveMarketingEmailsByRegion(region: RegionConfig | Region.SelfHosted) {
    let defaultValue;
    if (region === Region.SelfHosted) {
      defaultValue = DEFAULT_MARKETING_EMAILS_PREF_BY_REGION[region];
    } else {
      const regionKey = (region as RegionConfig).key;
      defaultValue = DEFAULT_MARKETING_EMAILS_PREF_BY_REGION[regionKey];
    }

    this.receiveMarketingEmails.setValue(defaultValue);
  }

  submit = async () => {
    const valid = this.validateForm();

    if (!valid) {
      return;
    }

    // The app expects null for name and not empty string.
    const sanitizedName = this.name.value === "" ? null : this.name.value;

    const request: RegisterSendVerificationEmailRequest = new RegisterSendVerificationEmailRequest(
      this.email.value,
      sanitizedName,
      this.receiveMarketingEmails.value,
    );

    const result = await this.accountApiService.registerSendVerificationEmail(request);

    if (typeof result === "string") {
      // we received a token, so the env doesn't support email verification
      // send the user directly to the finish registration page with the token as a query param
      await this.router.navigate(["/finish-signup"], {
        queryParams: { token: result, email: this.email.value },
      });
    }

    // Result is null, so email verification is required
    this.state = RegistrationStartState.CHECK_EMAIL;
    this.anonLayoutWrapperDataService.setAnonLayoutWrapperData({
      pageTitle: {
        key: "checkYourEmail",
      },
      pageIcon: Icons.RegistrationCheckEmailIcon,
    });
    this.registrationStartStateChange.emit(this.state);
  };

  handleSelectedRegionChange(region: RegionConfig | Region.SelfHosted | null) {
    this.isSelfHost = region === Region.SelfHosted;

    if (region !== null) {
      this.setReceiveMarketingEmailsByRegion(region);
    }
  }

  private validateForm(): boolean {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      this.showErrorSummary = true;
    }

    return this.formGroup.valid;
  }

  goBack() {
    this.state = RegistrationStartState.USER_DATA_ENTRY;
    this.anonLayoutWrapperDataService.setAnonLayoutWrapperData({
      pageIcon: RegistrationUserAddIcon,
      pageTitle: {
        key: "createAccount",
      },
    });
    this.registrationStartStateChange.emit(this.state);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
