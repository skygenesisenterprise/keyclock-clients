// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { Router } from "@angular/router";
import { combineLatest, firstValueFrom, map, Observable, Subject, takeUntil } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { PlanSponsorshipType } from "@bitwarden/common/billing/enums";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { ToastService } from "@bitwarden/components";

import { FreeFamiliesPolicyService } from "../services/free-families-policy.service";

interface RequestSponsorshipForm {
  selectedSponsorshipOrgId: FormControl<string>;
  sponsorshipEmail: FormControl<string>;
}

@Component({
  selector: "app-sponsored-families",
  templateUrl: "sponsored-families.component.html",
  standalone: false,
})
export class SponsoredFamiliesComponent implements OnInit, OnDestroy {
  loading = false;

  availableSponsorshipOrgs$: Observable<Organization[]>;
  activeSponsorshipOrgs$: Observable<Organization[]>;
  anyOrgsAvailable$: Observable<boolean>;
  anyActiveSponsorships$: Observable<boolean>;

  // Conditional display properties
  formPromise: Promise<void>;

  sponsorshipForm: FormGroup<RequestSponsorshipForm>;

  private _destroy = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private syncService: SyncService,
    private organizationService: OrganizationService,
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private toastService: ToastService,
    private policyService: PolicyService,
    private freeFamiliesPolicyService: FreeFamiliesPolicyService,
    private router: Router,
  ) {
    this.sponsorshipForm = this.formBuilder.group<RequestSponsorshipForm>({
      selectedSponsorshipOrgId: new FormControl("", {
        validators: [Validators.required],
      }),
      sponsorshipEmail: new FormControl("", {
        validators: [Validators.email, Validators.required],
        asyncValidators: [
          this.notAllowedValueAsync(
            () => firstValueFrom(this.accountService.activeAccount$.pipe(map((a) => a?.email))),
            true,
          ),
        ],
        updateOn: "change",
      }),
    });
  }

  async ngOnInit() {
    const userId = await firstValueFrom(getUserId(this.accountService.activeAccount$));

    await this.preventAccessToFreeFamiliesPage();

    this.availableSponsorshipOrgs$ = combineLatest([
      this.organizationService.organizations$(userId),
      this.policyService.policiesByType$(PolicyType.FreeFamiliesSponsorshipPolicy, userId),
    ]).pipe(
      map(([organizations, policies]) =>
        organizations
          .filter((org) => org.familySponsorshipAvailable)
          .map((org) => ({
            organization: org,
            isPolicyEnabled: policies.some(
              (policy) => policy.organizationId === org.id && policy.enabled,
            ),
          }))
          .filter(({ isPolicyEnabled }) => !isPolicyEnabled)
          .map(({ organization }) => organization),
      ),
    );

    this.availableSponsorshipOrgs$.pipe(takeUntil(this._destroy)).subscribe((orgs) => {
      if (orgs.length === 1) {
        this.sponsorshipForm.patchValue({
          selectedSponsorshipOrgId: orgs[0].id,
        });
      }
    });
    this.anyOrgsAvailable$ = this.availableSponsorshipOrgs$.pipe(map((orgs) => orgs.length > 0));

    this.activeSponsorshipOrgs$ = this.organizationService
      .organizations$(userId)
      .pipe(
        map((orgs) =>
          orgs.filter((o) => o.familySponsorshipFriendlyName !== null && !o.isAdminInitiated),
        ),
      );
    this.anyActiveSponsorships$ = this.activeSponsorshipOrgs$.pipe(map((orgs) => orgs.length > 0));

    this.loading = false;

    this.sponsorshipForm
      .get("sponsorshipEmail")
      .valueChanges.pipe(takeUntil(this._destroy))
      .subscribe((val) => {
        if (this.sponsorshipEmailControl.hasError("email")) {
          this.sponsorshipEmailControl.setErrors([{ message: this.i18nService.t("invalidEmail") }]);
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
  }

  private async preventAccessToFreeFamiliesPage() {
    const showFreeFamiliesPage = await firstValueFrom(
      this.freeFamiliesPolicyService.showFreeFamilies$,
    );

    if (!showFreeFamiliesPage) {
      await this.router.navigate(["/"]);
      return;
    }
  }

  submit = async () => {
    this.formPromise = this.apiService.postCreateSponsorship(
      this.sponsorshipForm.value.selectedSponsorshipOrgId,
      {
        sponsoredEmail: this.sponsorshipForm.value.sponsorshipEmail,
        planSponsorshipType: PlanSponsorshipType.FamiliesForEnterprise,
        friendlyName: this.sponsorshipForm.value.sponsorshipEmail,
      },
    );

    await this.formPromise;
    this.toastService.showToast({
      variant: "success",
      title: null,
      message: this.i18nService.t("sponsorshipCreated"),
    });
    this.formPromise = null;
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.resetForm();
    await this.forceReload();
  };

  async forceReload() {
    this.loading = true;
    await this.syncService.fullSync(true);
    this.loading = false;
  }

  get sponsorshipEmailControl() {
    return this.sponsorshipForm.controls.sponsorshipEmail;
  }

  private async resetForm() {
    this.sponsorshipForm.reset();
  }

  get isSelfHosted(): boolean {
    return this.platformUtilsService.isSelfHost();
  }

  notAllowedValueAsync(
    valueGetter: () => Promise<string>,
    caseInsensitive = false,
  ): AsyncValidatorFn {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      let notAllowedValue = await valueGetter();
      let controlValue = control.value;
      if (caseInsensitive) {
        notAllowedValue = notAllowedValue.toLowerCase();
        controlValue = controlValue.toLowerCase();
      }

      if (controlValue === notAllowedValue) {
        return {
          errors: {
            message: this.i18nService.t("cannotSponsorSelf"),
          },
        };
      }
    };
  }
}
