import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, debounceTime, firstValueFrom, map, Observable, of, switchMap } from "rxjs";

import {
  CriticalAppsService,
  RiskInsightsDataService,
  RiskInsightsReportService,
} from "@bitwarden/bit-common/dirt/reports/risk-insights";
import {
  ApplicationHealthReportDetail,
  ApplicationHealthReportDetailWithCriticalFlag,
  ApplicationHealthReportDetailWithCriticalFlagAndCipher,
  ApplicationHealthReportSummary,
} from "@bitwarden/bit-common/dirt/reports/risk-insights/models/password-health";
import {
  getOrganizationById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import {
  IconButtonModule,
  Icons,
  NoItemsModule,
  SearchModule,
  TableDataSource,
  ToastService,
} from "@bitwarden/components";
import { CardComponent } from "@bitwarden/dirt-card";
import { HeaderModule } from "@bitwarden/web-vault/app/layouts/header/header.module";
import { SharedModule } from "@bitwarden/web-vault/app/shared";
import { PipesModule } from "@bitwarden/web-vault/app/vault/individual-vault/pipes/pipes.module";

import { AppTableRowScrollableComponent } from "./app-table-row-scrollable.component";
import { ApplicationsLoadingComponent } from "./risk-insights-loading.component";

@Component({
  selector: "tools-all-applications",
  templateUrl: "./all-applications.component.html",
  imports: [
    ApplicationsLoadingComponent,
    HeaderModule,
    CardComponent,
    SearchModule,
    PipesModule,
    NoItemsModule,
    SharedModule,
    AppTableRowScrollableComponent,
    IconButtonModule,
  ],
})
export class AllApplicationsComponent implements OnInit {
  protected dataSource =
    new TableDataSource<ApplicationHealthReportDetailWithCriticalFlagAndCipher>();
  protected selectedUrls: Set<string> = new Set<string>();
  protected searchControl = new FormControl("", { nonNullable: true });
  protected loading = true;
  protected organization = new Organization();
  noItemsIcon = Icons.Security;
  protected markingAsCritical = false;
  protected applicationSummary: ApplicationHealthReportSummary = {
    totalMemberCount: 0,
    totalAtRiskMemberCount: 0,
    totalApplicationCount: 0,
    totalAtRiskApplicationCount: 0,
  };

  destroyRef = inject(DestroyRef);
  isLoading$: Observable<boolean> = of(false);

  async ngOnInit() {
    const organizationId = this.activatedRoute.snapshot.paramMap.get("organizationId");
    const userId = await firstValueFrom(getUserId(this.accountService.activeAccount$));

    if (organizationId) {
      const organization$ = this.organizationService
        .organizations$(userId)
        .pipe(getOrganizationById(organizationId));

      combineLatest([
        this.dataService.applications$,
        this.criticalAppsService.getAppsListForOrg(organizationId),
        organization$,
      ])
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          map(([applications, criticalApps, organization]) => {
            if (applications && applications.length === 0 && criticalApps && criticalApps) {
              const criticalUrls = criticalApps.map((ca) => ca.uri);
              const data = applications?.map((app) => ({
                ...app,
                isMarkedAsCritical: criticalUrls.includes(app.applicationName),
              })) as ApplicationHealthReportDetailWithCriticalFlag[];
              return { data, organization };
            }

            return { data: applications, organization };
          }),
          switchMap(async ({ data, organization }) => {
            if (data && organization) {
              const dataWithCiphers = await this.reportService.identifyCiphers(
                data,
                organization.id,
              );

              return {
                data: dataWithCiphers,
                organization,
              };
            }

            return { data: [], organization };
          }),
        )
        .subscribe(({ data, organization }) => {
          if (data) {
            this.dataSource.data = data;
            this.applicationSummary = this.reportService.generateApplicationsSummary(data);
          }
          if (organization) {
            this.organization = organization;
          }
        });

      this.isLoading$ = this.dataService.isLoading$;
    }
  }

  constructor(
    protected cipherService: CipherService,
    protected i18nService: I18nService,
    protected activatedRoute: ActivatedRoute,
    protected toastService: ToastService,
    protected configService: ConfigService,
    protected dataService: RiskInsightsDataService,
    protected organizationService: OrganizationService,
    protected reportService: RiskInsightsReportService,
    private accountService: AccountService,
    protected criticalAppsService: CriticalAppsService,
  ) {
    this.searchControl.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((v) => (this.dataSource.filter = v));
  }

  goToCreateNewLoginItem = async () => {
    // TODO: implement
    this.toastService.showToast({
      variant: "warning",
      title: "",
      message: "Not yet implemented",
    });
  };

  isMarkedAsCriticalItem(applicationName: string) {
    return this.selectedUrls.has(applicationName);
  }

  markAppsAsCritical = async () => {
    this.markingAsCritical = true;

    try {
      await this.criticalAppsService.setCriticalApps(
        this.organization.id,
        Array.from(this.selectedUrls),
      );

      this.toastService.showToast({
        variant: "success",
        title: "",
        message: this.i18nService.t("applicationsMarkedAsCriticalSuccess"),
      });
    } finally {
      this.selectedUrls.clear();
      this.markingAsCritical = false;
    }
  };

  trackByFunction(_: number, item: ApplicationHealthReportDetail) {
    return item.applicationName;
  }

  showAppAtRiskMembers = async (applicationName: string) => {
    const info = {
      members:
        this.dataSource.data.find((app) => app.applicationName === applicationName)
          ?.atRiskMemberDetails ?? [],
      applicationName,
    };
    this.dataService.setDrawerForAppAtRiskMembers(info, applicationName);
  };

  showOrgAtRiskMembers = async (invokerId: string) => {
    const dialogData = this.reportService.generateAtRiskMemberList(this.dataSource.data);
    this.dataService.setDrawerForOrgAtRiskMembers(dialogData, invokerId);
  };

  showOrgAtRiskApps = async (invokerId: string) => {
    const data = this.reportService.generateAtRiskApplicationList(this.dataSource.data);
    this.dataService.setDrawerForOrgAtRiskApps(data, invokerId);
  };

  onCheckboxChange = (applicationName: string, event: Event) => {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedUrls.add(applicationName);
    } else {
      this.selectedUrls.delete(applicationName);
    }
  };

  getSelectedUrls = () => Array.from(this.selectedUrls);

  isDrawerOpenForTableRow = (applicationName: string): boolean => {
    return this.dataService.drawerInvokerId === applicationName;
  };
}
