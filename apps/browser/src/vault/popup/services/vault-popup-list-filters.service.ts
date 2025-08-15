import { Injectable } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder } from "@angular/forms";
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap,
  take,
} from "rxjs";

import { CollectionService, CollectionView } from "@bitwarden/admin-console/common";
import { ViewCacheService } from "@bitwarden/angular/platform/view-cache";
import { DynamicTreeNode } from "@bitwarden/angular/vault/vault-filter/models/dynamic-tree-node.model";
import { sortDefaultCollections } from "@bitwarden/angular/vault/vault-filter/services/vault-filter.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { getUserId } from "@bitwarden/common/auth/services/account.service";
import { ProductTierType } from "@bitwarden/common/billing/enums";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import {
  KeyDefinition,
  StateProvider,
  VAULT_SETTINGS_DISK,
} from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherType } from "@bitwarden/common/vault/enums";
import { ITreeNodeObject, TreeNode } from "@bitwarden/common/vault/models/domain/tree-node";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { ServiceUtils } from "@bitwarden/common/vault/service-utils";
import { RestrictedItemTypesService } from "@bitwarden/common/vault/services/restricted-item-types.service";
import { CIPHER_MENU_ITEMS } from "@bitwarden/common/vault/types/cipher-menu-items";
import { CipherViewLikeUtils } from "@bitwarden/common/vault/utils/cipher-view-like-utils";
import { ChipSelectOption } from "@bitwarden/components";

import { PopupCipherViewLike } from "../views/popup-cipher.view";

const FILTER_VISIBILITY_KEY = new KeyDefinition<boolean>(VAULT_SETTINGS_DISK, "filterVisibility", {
  deserializer: (obj) => obj,
});

/**
 * Serialized state of the PopupListFilter for interfacing with the PopupViewCacheService
 */
export interface CachedFilterState {
  organizationId?: string;
  collectionId?: string;
  folderId?: string;
  cipherType?: CipherType | null;
}

/** All available cipher filters */
export type PopupListFilter = {
  organization: Organization | null;
  collection: CollectionView | null;
  folder: FolderView | null;
  cipherType: CipherType | null;
};

/** Delimiter that denotes a level of nesting  */
const NESTING_DELIMITER = "/";

/** Id assigned to the "My vault" organization */
export const MY_VAULT_ID = "MyVault";

const INITIAL_FILTERS: PopupListFilter = {
  organization: null,
  collection: null,
  folder: null,
  cipherType: null,
};

@Injectable({
  providedIn: "root",
})
export class VaultPopupListFiltersService {
  /**
   * UI form for all filters
   */
  filterForm = this.formBuilder.group<PopupListFilter>(INITIAL_FILTERS);

  /**
   * Observable for `filterForm` value
   */
  filters$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.value),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Emits the number of applied filters. */
  numberOfAppliedFilters$ = this.filters$.pipe(
    map((filters) => Object.values(filters).filter((filter) => Boolean(filter)).length),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  /** Stored state for the visibility of the filters. */
  private filterVisibilityState = this.stateProvider.getGlobal(FILTER_VISIBILITY_KEY);

  /**
   * Static list of ciphers views used in synchronous context
   */
  private cipherViews: PopupCipherViewLike[] = [];

  private activeUserId$ = this.accountService.activeAccount$.pipe(
    map((a) => a?.id),
    filter((userId): userId is UserId => userId !== null),
  );

  private serializeFilters(): CachedFilterState {
    return {
      organizationId: this.filterForm.value.organization?.id,
      collectionId: this.filterForm.value.collection?.id,
      folderId: this.filterForm.value.folder?.id,
      cipherType: this.filterForm.value.cipherType,
    };
  }

  private deserializeFilters(state: CachedFilterState): void {
    combineLatest([this.organizations$, this.collections$, this.folders$])
      .pipe(take(1))
      .subscribe(([orgOptions, collectionOptions, folderOptions]) => {
        const patchValue: PopupListFilter = {
          organization: null,
          collection: null,
          folder: null,
          cipherType: null,
        };

        if (state.organizationId) {
          if (state.organizationId === MY_VAULT_ID) {
            patchValue.organization = { id: MY_VAULT_ID } as Organization;
          } else {
            const orgOption = orgOptions.find((o) => o.value?.id === state.organizationId);
            patchValue.organization = orgOption?.value || null;
          }
        }

        if (state.collectionId) {
          const collection = collectionOptions
            .flatMap((c) => this.flattenOptions(c))
            .find((c) => c.value?.id === state.collectionId)?.value;
          patchValue.collection = collection || null;
        }

        if (state.folderId) {
          const folder = folderOptions
            .flatMap((f) => this.flattenOptions(f))
            .find((f) => f.value?.id === state.folderId)?.value;
          patchValue.folder = folder || null;
        }

        if (state.cipherType) {
          patchValue.cipherType = state.cipherType;
        }

        this.filterForm.patchValue(patchValue);
      });
  }

  private flattenOptions<T>(option: ChipSelectOption<T>): ChipSelectOption<T>[] {
    return [option, ...(option.children?.flatMap((c) => this.flattenOptions(c)) || [])];
  }

  constructor(
    private folderService: FolderService,
    private cipherService: CipherService,
    private organizationService: OrganizationService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private policyService: PolicyService,
    private stateProvider: StateProvider,
    private accountService: AccountService,
    private viewCacheService: ViewCacheService,
    private restrictedItemTypesService: RestrictedItemTypesService,
    private configService: ConfigService,
  ) {
    this.filterForm.controls.organization.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(this.validateOrganizationChange.bind(this));

    const cachedFilters = this.viewCacheService.signal<CachedFilterState>({
      key: "vault-filters",
      initialValue: {},
      deserializer: (v) => v,
      persistNavigation: true,
    });

    this.deserializeFilters(cachedFilters());

    // Save changes to cache
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        map(() => this.serializeFilters()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      )
      .subscribe((state) => {
        cachedFilters.set(state);
      });
  }

  /** Stored state for the visibility of the filters. */
  filterVisibilityState$ = this.filterVisibilityState.state$;

  /**
   * Observable whose value is a function that filters an array of `PopupCipherViewLike` objects based on the current filters
   */
  filterFunction$: Observable<(ciphers: PopupCipherViewLike[]) => PopupCipherViewLike[]> =
    this.filters$.pipe(
      map(
        (filters) => (ciphers: PopupCipherViewLike[]) =>
          ciphers.filter((cipher) => {
            // Vault popup lists never shows deleted ciphers
            if (CipherViewLikeUtils.isDeleted(cipher)) {
              return false;
            }

            if (
              filters.cipherType !== null &&
              CipherViewLikeUtils.getType(cipher) !== filters.cipherType
            ) {
              return false;
            }

            if (filters.collection && !cipher.collectionIds?.includes(filters.collection.id!)) {
              return false;
            }

            if (filters.folder && cipher.folderId !== filters.folder.id) {
              return false;
            }

            const isMyVault = filters.organization?.id === MY_VAULT_ID;

            if (isMyVault) {
              if (cipher.organizationId != null) {
                return false;
              }
            } else if (filters.organization) {
              if (cipher.organizationId !== filters.organization.id) {
                return false;
              }
            }

            return true;
          }),
      ),
    );

  /**
   * All available cipher types (filtered by policy restrictions)
   */
  readonly cipherTypes$: Observable<ChipSelectOption<CipherType>[]> =
    this.restrictedItemTypesService.restricted$.pipe(
      map((restrictedTypes) => {
        return CIPHER_MENU_ITEMS.filter((item) => {
          const restriction = restrictedTypes.find((r) => r.cipherType === item.type);
          // Show if no restriction or if the restriction allows viewing in at least one org
          return !restriction || restriction.allowViewOrgIds.length > 0;
        }).map((item) => ({
          value: item.type,
          label: this.i18nService.t(item.labelKey),
          icon: item.icon,
        }));
      }),
    );

  /** Resets `filterForm` to the original state */
  resetFilterForm(): void {
    this.filterForm.reset(INITIAL_FILTERS);
  }

  /**
   * Organization array structured to be directly passed to `ChipSelectComponent`
   */

  organizations$: Observable<ChipSelectOption<Organization>[]> =
    this.accountService.activeAccount$.pipe(
      getUserId,
      switchMap((userId) =>
        combineLatest([
          this.organizationService.memberOrganizations$(userId),
          this.policyService.policyAppliesToUser$(PolicyType.OrganizationDataOwnership, userId),
        ]),
      ),
      map(([orgs, organizationDataOwnership]): [Organization[], boolean] => [
        orgs.sort(Utils.getSortFunction(this.i18nService, "name")),
        organizationDataOwnership,
      ]),
      map(([orgs, organizationDataOwnership]) => {
        // When there are no organizations return an empty array,
        // resulting in the org filter being hidden
        if (!orgs.length) {
          return [];
        }

        // When there is only one organization and organization data ownership policy applies,
        // return an empty array, resulting in the org filter being hidden
        if (orgs.length === 1 && organizationDataOwnership) {
          return [];
        }

        const myVaultOrg: ChipSelectOption<Organization>[] = [];

        // Only add "My vault" if organization data ownership policy does not apply
        if (!organizationDataOwnership) {
          myVaultOrg.push({
            value: { id: MY_VAULT_ID } as Organization,
            label: this.i18nService.t("myVault"),
            icon: "bwi-user",
          });
        }

        return [
          ...myVaultOrg,
          ...orgs.map((org) => {
            let icon = "bwi-business";

            if (!org.enabled) {
              // Show a warning icon if the organization is deactivated
              icon = "bwi-exclamation-triangle tw-text-danger";
            } else if (
              org.productTierType === ProductTierType.Families ||
              org.productTierType === ProductTierType.Free
            ) {
              // Show a family icon if the organization is a family or free org
              icon = "bwi-family";
            }

            return {
              value: org,
              label: org.name,
              icon,
            };
          }),
        ];
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

  /**
   * Folder array structured to be directly passed to `ChipSelectComponent`
   */
  folders$: Observable<ChipSelectOption<FolderView>[]> = this.activeUserId$.pipe(
    switchMap((userId) => {
      // Observable of cipher views
      const cipherViews$ = this.cipherService.cipherListViews$(userId).pipe(
        map((ciphers) => {
          this.cipherViews = ciphers ? Object.values(ciphers) : [];
          return this.cipherViews;
        }),
      );

      return combineLatest([
        this.filters$.pipe(
          distinctUntilChanged(
            (previousFilter, currentFilter) =>
              // Only update the collections when the organizationId filter changes
              previousFilter.organization?.id === currentFilter.organization?.id,
          ),
        ),
        this.folderService.folderViews$(userId),
        cipherViews$,
      ]).pipe(
        map(
          ([filters, folders, cipherViews]): [
            PopupListFilter,
            FolderView[],
            PopupCipherViewLike[],
          ] => {
            if (folders.length === 1 && folders[0].id === null) {
              // Do not display folder selections when only the "no folder" option is available.
              return [filters as PopupListFilter, [], cipherViews];
            }

            // Sort folders by alphabetic name
            folders.sort(Utils.getSortFunction(this.i18nService, "name"));
            let arrangedFolders = folders;

            const noFolder = folders.find((f) => f.id === null);

            if (noFolder) {
              // Update `name` of the "no folder" option to "Items with no folder"
              const updatedNoFolder = {
                ...noFolder,
                name: this.i18nService.t("itemsWithNoFolder"),
              };

              // Move the "no folder" option to the end of the list
              arrangedFolders = [...folders.filter((f) => f.id !== null), updatedNoFolder];
            }
            return [filters as PopupListFilter, arrangedFolders, cipherViews];
          },
        ),
        map(([filters, folders, cipherViews]) => {
          const organizationId = filters.organization?.id ?? null;

          // When no org or "My vault" is selected, return all folders
          if (organizationId === null || organizationId === MY_VAULT_ID) {
            return folders;
          }

          const orgCiphers = cipherViews.filter((c) => c.organizationId === organizationId);

          // Return only the folders that have ciphers within the filtered organization
          return folders.filter((f) => orgCiphers.some((oc) => oc.folderId === f.id));
        }),
        map((folders) => {
          const nestedFolders = this.getAllFoldersNested(folders);
          return new DynamicTreeNode<FolderView>({
            fullList: folders,
            nestedList: nestedFolders,
          });
        }),
        map((folders) =>
          folders.nestedList.map((f) => this.convertToChipSelectOption(f, "bwi-folder")),
        ),
      );
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  /**
   * Collection array structured to be directly passed to `ChipSelectComponent`
   */
  collections$: Observable<ChipSelectOption<CollectionView>[]> =
    this.accountService.activeAccount$.pipe(
      getUserId,
      switchMap((userId) =>
        combineLatest([
          this.filters$.pipe(
            distinctUntilChanged((prev, curr) => prev.organization?.id === curr.organization?.id),
          ),
          this.collectionService.decryptedCollections$(userId),
          this.organizationService.memberOrganizations$(userId),
          this.configService.getFeatureFlag$(FeatureFlag.CreateDefaultLocation),
        ]),
      ),
      map(([filters, allCollections, orgs, defaultVaultEnabled]) => {
        const orgFilterId = filters.organization?.id ?? null;
        // When the organization filter is selected, filter out collections that do not belong to the selected organization
        const filtered = orgFilterId
          ? allCollections.filter((c) => c.organizationId === orgFilterId)
          : allCollections;

        if (!defaultVaultEnabled) {
          return filtered;
        }
        return sortDefaultCollections(filtered, orgs, this.i18nService.collator);
      }),
      map((fullList) => {
        return new DynamicTreeNode<CollectionView>({
          fullList,
          nestedList: this.collectionService.getAllNested(fullList),
        });
      }),
      map((tree) =>
        tree.nestedList.map((c) => this.convertToChipSelectOption(c, "bwi-collection-shared")),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  /** Organizations, collection, folders filters. */
  allFilters$ = combineLatest([this.organizations$, this.collections$, this.folders$]);

  /** Updates the stored state for filter visibility. */
  async updateFilterVisibility(isVisible: boolean): Promise<void> {
    await this.filterVisibilityState.update(() => isVisible);
  }

  /**
   * Converts the given item into the `ChipSelectOption` structure
   */
  private convertToChipSelectOption<T extends ITreeNodeObject>(
    item: TreeNode<T>,
    icon: string,
  ): ChipSelectOption<T> {
    return {
      value: item.node,
      label: item.node.name,
      icon,
      children: item.children
        ? item.children.map((i) => this.convertToChipSelectOption(i, icon))
        : undefined,
    };
  }

  /**
   * Returns a nested folder structure based on the input FolderView array
   */
  private getAllFoldersNested(folders: FolderView[]): TreeNode<FolderView>[] {
    const nodes: TreeNode<FolderView>[] = [];

    folders.forEach((f) => {
      const folderCopy = new FolderView();
      folderCopy.id = f.id;
      folderCopy.revisionDate = f.revisionDate;

      // Remove "/" from beginning and end of the folder name
      // then split the folder name by the delimiter
      const parts = f.name != null ? f.name.replace(/^\/+|\/+$/g, "").split(NESTING_DELIMITER) : [];
      ServiceUtils.nestedTraverse(nodes, 0, parts, folderCopy, undefined, NESTING_DELIMITER);
    });

    return nodes;
  }

  /**
   * Validate collection & folder filters when the organization filter changes
   */
  private validateOrganizationChange(organization: Organization | null): void {
    if (!organization) {
      return;
    }

    const currentFilters = this.filterForm.getRawValue();

    // When the organization filter changes and a collection is already selected,
    // reset the collection filter if the collection does not belong to the new organization filter
    if (currentFilters.collection && currentFilters.collection.organizationId !== organization.id) {
      this.filterForm.get("collection")?.setValue(null);
    }

    // When the organization filter changes and a folder is already selected,
    // reset the folder filter if the folder does not belong to the new organization filter
    if (
      currentFilters.folder &&
      currentFilters.folder.id !== null &&
      organization.id !== MY_VAULT_ID
    ) {
      // Get all ciphers that belong to the new organization
      const orgCiphers = this.cipherViews.filter((c) => c.organizationId === organization.id);

      // Find any ciphers within the organization that belong to the current folder
      const newOrgContainsFolder = orgCiphers.some(
        (oc) => oc.folderId === currentFilters?.folder?.id,
      );

      // If the new organization does not contain the current folder, reset the folder filter
      if (!newOrgContainsFolder) {
        this.filterForm.get("folder")?.setValue(null);
      }
    }
  }
}
