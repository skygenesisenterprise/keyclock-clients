import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { filter, from, lastValueFrom, map, Observable, Subject, switchMap, takeWhile } from "rxjs";
import { take } from "rxjs/operators";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { OrganizationBillingApiServiceAbstraction } from "@bitwarden/common/billing/abstractions/organizations/organization-billing-api.service.abstraction";
import { OrganizationWarningsResponse } from "@bitwarden/common/billing/models/response/organization-warnings.response";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { SyncService } from "@bitwarden/common/platform/sync";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { DialogService } from "@bitwarden/components";

import { openChangePlanDialog } from "../../organizations/change-plan-dialog.component";
import {
  TRIAL_PAYMENT_METHOD_DIALOG_RESULT_TYPE,
  TrialPaymentDialogComponent,
} from "../../shared/trial-payment-dialog/trial-payment-dialog.component";
import { OrganizationFreeTrialWarning, OrganizationResellerRenewalWarning } from "../types";

const format = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

@Injectable({ providedIn: "root" })
export class OrganizationWarningsService {
  private cache$ = new Map<OrganizationId, Observable<OrganizationWarningsResponse>>();
  private refreshWarnings$ = new Subject<OrganizationId>();

  constructor(
    private configService: ConfigService,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private organizationApiService: OrganizationApiServiceAbstraction,
    private organizationBillingApiService: OrganizationBillingApiServiceAbstraction,
    private router: Router,
    private location: Location,
    protected syncService: SyncService,
  ) {}

  getFreeTrialWarning$ = (
    organization: Organization,
    bypassCache: boolean = false,
  ): Observable<OrganizationFreeTrialWarning> =>
    this.getWarning$(organization, (response) => response.freeTrial, bypassCache).pipe(
      map((warning) => {
        const { remainingTrialDays } = warning;

        if (remainingTrialDays >= 2) {
          return {
            organization,
            message: this.i18nService.t("freeTrialEndPromptCount", remainingTrialDays),
          };
        }

        if (remainingTrialDays == 1) {
          return {
            organization,
            message: this.i18nService.t("freeTrialEndPromptTomorrowNoOrgName"),
          };
        }

        return {
          organization,
          message: this.i18nService.t("freeTrialEndingTodayWithoutOrgName"),
        };
      }),
    );

  getResellerRenewalWarning$ = (
    organization: Organization,
    bypassCache: boolean = false,
  ): Observable<OrganizationResellerRenewalWarning> =>
    this.getWarning$(organization, (response) => response.resellerRenewal, bypassCache).pipe(
      map((warning): OrganizationResellerRenewalWarning | null => {
        switch (warning.type) {
          case "upcoming": {
            return {
              type: "info",
              message: this.i18nService.t(
                "resellerRenewalWarningMsg",
                organization.providerName,
                format(warning.upcoming!.renewalDate),
              ),
            };
          }
          case "issued": {
            return {
              type: "info",
              message: this.i18nService.t(
                "resellerOpenInvoiceWarningMgs",
                organization.providerName,
                format(warning.issued!.issuedDate),
                format(warning.issued!.dueDate),
              ),
            };
          }
          case "past_due": {
            return {
              type: "warning",
              message: this.i18nService.t(
                "resellerPastDueWarningMsg",
                organization.providerName,
                format(warning.pastDue!.suspensionDate),
              ),
            };
          }
        }
      }),
      filter((result): result is NonNullable<typeof result> => result !== null),
    );

  showInactiveSubscriptionDialog$ = (
    organization: Organization,
    bypassCache: boolean = false,
  ): Observable<void> =>
    this.getWarning$(organization, (response) => response.inactiveSubscription, bypassCache).pipe(
      switchMap(async (warning) => {
        switch (warning.resolution) {
          case "contact_provider": {
            await this.dialogService.openSimpleDialog({
              title: this.i18nService.t("suspendedOrganizationTitle", organization.name),
              content: {
                key: "suspendedManagedOrgMessage",
                placeholders: [organization.providerName],
              },
              type: "danger",
              acceptButtonText: this.i18nService.t("close"),
              cancelButtonText: null,
            });
            break;
          }
          case "add_payment_method": {
            const confirmed = await this.dialogService.openSimpleDialog({
              title: this.i18nService.t("suspendedOrganizationTitle", organization.name),
              content: { key: "suspendedOwnerOrgMessage" },
              type: "danger",
              acceptButtonText: this.i18nService.t("continue"),
              cancelButtonText: this.i18nService.t("close"),
            });
            if (confirmed) {
              const managePaymentDetailsOutsideCheckout = await this.configService.getFeatureFlag(
                FeatureFlag.PM21881_ManagePaymentDetailsOutsideCheckout,
              );
              const route = managePaymentDetailsOutsideCheckout
                ? "payment-details"
                : "payment-method";
              await this.router.navigate(
                ["organizations", `${organization.id}`, "billing", route],
                {
                  state: { launchPaymentModalAutomatically: true },
                },
              );
            }
            break;
          }
          case "resubscribe": {
            const subscription = await this.organizationApiService.getSubscription(organization.id);
            const dialogReference = openChangePlanDialog(this.dialogService, {
              data: {
                organizationId: organization.id,
                subscription: subscription,
                productTierType: organization.productTierType,
              },
            });
            await lastValueFrom(dialogReference.closed);
            break;
          }
          case "contact_owner": {
            await this.dialogService.openSimpleDialog({
              title: this.i18nService.t("suspendedOrganizationTitle", organization.name),
              content: { key: "suspendedUserOrgMessage" },
              type: "danger",
              acceptButtonText: this.i18nService.t("close"),
              cancelButtonText: null,
            });
            break;
          }
          case "add_payment_method_optional_trial": {
            const organizationSubscriptionResponse =
              await this.organizationApiService.getSubscription(organization.id);

            const dialogRef = TrialPaymentDialogComponent.open(this.dialogService, {
              data: {
                organizationId: organization.id,
                subscription: organizationSubscriptionResponse,
                productTierType: organization?.productTierType,
              },
            });
            const result = await lastValueFrom(dialogRef.closed);
            if (result === TRIAL_PAYMENT_METHOD_DIALOG_RESULT_TYPE.SUBMITTED) {
              this.refreshWarnings$.next(organization.id as OrganizationId);
            }
          }
        }
      }),
    );

  refreshWarningsForOrganization$(organizationId: OrganizationId): Observable<void> {
    return this.refreshWarnings$.pipe(
      filter((id) => id === organizationId),
      map((): void => void 0),
    );
  }

  private getResponse$ = (
    organization: Organization,
    bypassCache: boolean = false,
  ): Observable<OrganizationWarningsResponse> => {
    const existing = this.cache$.get(organization.id as OrganizationId);
    if (existing && !bypassCache) {
      return existing;
    }
    const response$ = from(this.organizationBillingApiService.getWarnings(organization.id));
    this.cache$.set(organization.id as OrganizationId, response$);
    return response$;
  };

  private getWarning$ = <T>(
    organization: Organization,
    extract: (response: OrganizationWarningsResponse) => T | null | undefined,
    bypassCache: boolean = false,
  ): Observable<T> =>
    this.getResponse$(organization, bypassCache).pipe(
      map(extract),
      takeWhile((warning): warning is T => !!warning),
      take(1),
    );
}
