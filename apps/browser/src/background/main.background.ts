// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import "core-js/proposals/explicit-resource-management";

import { filter, firstValueFrom, map, merge, Subject, timeout } from "rxjs";

import { CollectionService, DefaultCollectionService } from "@bitwarden/admin-console/common";
import {
  AuthRequestApiServiceAbstraction,
  AuthRequestService,
  AuthRequestServiceAbstraction,
  DefaultAuthRequestApiService,
  DefaultLockService,
  InternalUserDecryptionOptionsServiceAbstraction,
  LoginEmailServiceAbstraction,
  LogoutReason,
  UserDecryptionOptionsService,
} from "@bitwarden/auth/common";
import { ApiService as ApiServiceAbstraction } from "@bitwarden/common/abstractions/api.service";
import { AuditService as AuditServiceAbstraction } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService as EventCollectionServiceAbstraction } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { InternalOrganizationServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { InternalPolicyService as InternalPolicyServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { ProviderService as ProviderServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/provider.service";
import { DefaultOrganizationService } from "@bitwarden/common/admin-console/services/organization/default-organization.service";
import { DefaultPolicyService } from "@bitwarden/common/admin-console/services/policy/default-policy.service";
import { PolicyApiService } from "@bitwarden/common/admin-console/services/policy/policy-api.service";
import { ProviderService } from "@bitwarden/common/admin-console/services/provider.service";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService as AvatarServiceAbstraction } from "@bitwarden/common/auth/abstractions/avatar.service";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { DevicesApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices-api.service.abstraction";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { TokenService as TokenServiceAbstraction } from "@bitwarden/common/auth/abstractions/token.service";
import { UserVerificationApiServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification-api.service.abstraction";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { AccountServiceImplementation } from "@bitwarden/common/auth/services/account.service";
import { AuthService } from "@bitwarden/common/auth/services/auth.service";
import { AvatarService } from "@bitwarden/common/auth/services/avatar.service";
import { DefaultActiveUserAccessor } from "@bitwarden/common/auth/services/default-active-user.accessor";
import { DevicesServiceImplementation } from "@bitwarden/common/auth/services/devices/devices.service.implementation";
import { DevicesApiServiceImplementation } from "@bitwarden/common/auth/services/devices-api.service.implementation";
import { SsoLoginService } from "@bitwarden/common/auth/services/sso-login.service";
import { TokenService } from "@bitwarden/common/auth/services/token.service";
import { UserVerificationApiService } from "@bitwarden/common/auth/services/user-verification/user-verification-api.service";
import { UserVerificationService } from "@bitwarden/common/auth/services/user-verification/user-verification.service";
import {
  AutofillSettingsService,
  AutofillSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/autofill-settings.service";
import {
  BadgeSettingsService,
  BadgeSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/badge-settings.service";
import {
  DefaultDomainSettingsService,
  DomainSettingsService,
} from "@bitwarden/common/autofill/services/domain-settings.service";
import {
  UserNotificationSettingsService,
  UserNotificationSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/user-notification-settings.service";
import { isUrlInList } from "@bitwarden/common/autofill/utils";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { DefaultBillingAccountProfileStateService } from "@bitwarden/common/billing/services/account/billing-account-profile-state.service";
import { ClientType } from "@bitwarden/common/enums";
import { ProcessReloadServiceAbstraction } from "@bitwarden/common/key-management/abstractions/process-reload.service";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "@bitwarden/common/key-management/crypto/abstractions/crypto-function.service";
import { EncryptService } from "@bitwarden/common/key-management/crypto/abstractions/encrypt.service";
import { EncryptServiceImplementation } from "@bitwarden/common/key-management/crypto/services/encrypt.service.implementation";
import { WebCryptoFunctionService } from "@bitwarden/common/key-management/crypto/services/web-crypto-function.service";
import { DeviceTrustServiceAbstraction } from "@bitwarden/common/key-management/device-trust/abstractions/device-trust.service.abstraction";
import { DeviceTrustService } from "@bitwarden/common/key-management/device-trust/services/device-trust.service.implementation";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/key-management/key-connector/abstractions/key-connector.service";
import { KeyConnectorService } from "@bitwarden/common/key-management/key-connector/services/key-connector.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/key-management/master-password/abstractions/master-password.service.abstraction";
import { MasterPasswordService } from "@bitwarden/common/key-management/master-password/services/master-password.service";
import { PinServiceAbstraction } from "@bitwarden/common/key-management/pin/pin.service.abstraction";
import { PinService } from "@bitwarden/common/key-management/pin/pin.service.implementation";
import { DefaultProcessReloadService } from "@bitwarden/common/key-management/services/default-process-reload.service";
import {
  DefaultVaultTimeoutSettingsService,
  VaultTimeoutSettingsService,
  VaultTimeoutStringType,
} from "@bitwarden/common/key-management/vault-timeout";
import { AppIdService as AppIdServiceAbstraction } from "@bitwarden/common/platform/abstractions/app-id.service";
import { ConfigApiServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config-api.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { RegionConfig } from "@bitwarden/common/platform/abstractions/environment.service";
import { Fido2ActiveRequestManager as Fido2ActiveRequestManagerAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-active-request-manager.abstraction";
import { Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-authenticator.service.abstraction";
import { Fido2ClientService as Fido2ClientServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/platform/abstractions/fido2/fido2-user-interface.service.abstraction";
import { FileUploadService as FileUploadServiceAbstraction } from "@bitwarden/common/platform/abstractions/file-upload/file-upload.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { KeyGenerationService as KeyGenerationServiceAbstraction } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SdkLoadService } from "@bitwarden/common/platform/abstractions/sdk/sdk-load.service";
import { SdkService } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { StateService as StateServiceAbstraction } from "@bitwarden/common/platform/abstractions/state.service";
import {
  AbstractStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { IpcService } from "@bitwarden/common/platform/ipc";
import { Message, MessageListener, MessageSender } from "@bitwarden/common/platform/messaging";
// eslint-disable-next-line no-restricted-imports -- Used for dependency creation
import { SubjectMessageSender } from "@bitwarden/common/platform/messaging/internal";
import { Lazy } from "@bitwarden/common/platform/misc/lazy";
import { Account } from "@bitwarden/common/platform/models/domain/account";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { NotificationsService } from "@bitwarden/common/platform/notifications";
// eslint-disable-next-line no-restricted-imports -- Needed for service creation
import {
  DefaultNotificationsService,
  SignalRConnectionService,
  UnsupportedWebPushConnectionService,
  WebPushNotificationsApiService,
  WorkerWebPushConnectionService,
} from "@bitwarden/common/platform/notifications/internal";
import { AppIdService } from "@bitwarden/common/platform/services/app-id.service";
import { ConfigApiService } from "@bitwarden/common/platform/services/config/config-api.service";
import { DefaultConfigService } from "@bitwarden/common/platform/services/config/default-config.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import { Fido2ActiveRequestManager } from "@bitwarden/common/platform/services/fido2/fido2-active-request-manager";
import { Fido2AuthenticatorService } from "@bitwarden/common/platform/services/fido2/fido2-authenticator.service";
import { Fido2ClientService } from "@bitwarden/common/platform/services/fido2/fido2-client.service";
import { FileUploadService } from "@bitwarden/common/platform/services/file-upload/file-upload.service";
import { KeyGenerationService } from "@bitwarden/common/platform/services/key-generation.service";
import { MigrationBuilderService } from "@bitwarden/common/platform/services/migration-builder.service";
import { MigrationRunner } from "@bitwarden/common/platform/services/migration-runner";
import { DefaultSdkClientFactory } from "@bitwarden/common/platform/services/sdk/default-sdk-client-factory";
import { DefaultSdkService } from "@bitwarden/common/platform/services/sdk/default-sdk.service";
import { NoopSdkClientFactory } from "@bitwarden/common/platform/services/sdk/noop-sdk-client-factory";
import { StateService } from "@bitwarden/common/platform/services/state.service";
import { SystemService } from "@bitwarden/common/platform/services/system.service";
import { UserAutoUnlockKeyService } from "@bitwarden/common/platform/services/user-auto-unlock-key.service";
import {
  ActiveUserStateProvider,
  DerivedStateProvider,
  GlobalStateProvider,
  SingleUserStateProvider,
  StateEventRunnerService,
  StateProvider,
} from "@bitwarden/common/platform/state";
/* eslint-disable import/no-restricted-paths -- We need the implementation to inject, but generally these should not be accessed */
import { DefaultActiveUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-active-user-state.provider";
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";
import { DefaultSingleUserStateProvider } from "@bitwarden/common/platform/state/implementations/default-single-user-state.provider";
import { DefaultStateProvider } from "@bitwarden/common/platform/state/implementations/default-state.provider";
import { InlineDerivedStateProvider } from "@bitwarden/common/platform/state/implementations/inline-derived-state";
import { StateEventRegistrarService } from "@bitwarden/common/platform/state/state-event-registrar.service";
/* eslint-enable import/no-restricted-paths */
import { PrimarySecondaryStorageService } from "@bitwarden/common/platform/storage/primary-secondary-storage.service";
import { WindowStorageService } from "@bitwarden/common/platform/storage/window-storage.service";
import { SyncService } from "@bitwarden/common/platform/sync";
// eslint-disable-next-line no-restricted-imports -- Needed for service creation
import { DefaultSyncService } from "@bitwarden/common/platform/sync/internal";
import { DefaultThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { ApiService } from "@bitwarden/common/services/api.service";
import { AuditService } from "@bitwarden/common/services/audit.service";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";
import {
  PasswordStrengthService,
  PasswordStrengthServiceAbstraction,
} from "@bitwarden/common/tools/password-strength";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service";
import { SendApiService as SendApiServiceAbstraction } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { SendStateProvider } from "@bitwarden/common/tools/send/services/send-state.provider";
import { SendService } from "@bitwarden/common/tools/send/services/send.service";
import { InternalSendService as InternalSendServiceAbstraction } from "@bitwarden/common/tools/send/services/send.service.abstraction";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherEncryptionService } from "@bitwarden/common/vault/abstractions/cipher-encryption.service";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { FolderApiServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder-api.service.abstraction";
import { InternalFolderService as InternalFolderServiceAbstraction } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/vault/abstractions/search.service";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { VaultSettingsService as VaultSettingsServiceAbstraction } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { ExtensionPageUrls } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  DefaultEndUserNotificationService,
  EndUserNotificationService,
} from "@bitwarden/common/vault/notifications";
import {
  CipherAuthorizationService,
  DefaultCipherAuthorizationService,
} from "@bitwarden/common/vault/services/cipher-authorization.service";
import { CipherService } from "@bitwarden/common/vault/services/cipher.service";
import { DefaultCipherEncryptionService } from "@bitwarden/common/vault/services/default-cipher-encryption.service";
import { CipherFileUploadService } from "@bitwarden/common/vault/services/file-upload/cipher-file-upload.service";
import { FolderApiService } from "@bitwarden/common/vault/services/folder/folder-api.service";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";
import { RestrictedItemTypesService } from "@bitwarden/common/vault/services/restricted-item-types.service";
import { SearchService } from "@bitwarden/common/vault/services/search.service";
import { TotpService } from "@bitwarden/common/vault/services/totp.service";
import { VaultSettingsService } from "@bitwarden/common/vault/services/vault-settings/vault-settings.service";
import { DefaultTaskService, TaskService } from "@bitwarden/common/vault/tasks";
import {
  legacyPasswordGenerationServiceFactory,
  legacyUsernameGenerationServiceFactory,
  PasswordGenerationServiceAbstraction,
  UsernameGenerationServiceAbstraction,
} from "@bitwarden/generator-legacy";
import {
  ImportApiService,
  ImportApiServiceAbstraction,
  ImportService,
  ImportServiceAbstraction,
} from "@bitwarden/importer-core";
import {
  BiometricsService,
  BiometricStateService,
  DefaultBiometricStateService,
  DefaultKdfConfigService,
  DefaultKeyService,
  KdfConfigService,
  KeyService as KeyServiceAbstraction,
} from "@bitwarden/key-management";
import { BackgroundSyncService } from "@bitwarden/platform/background-sync";
import {
  IndividualVaultExportService,
  IndividualVaultExportServiceAbstraction,
  OrganizationVaultExportService,
  OrganizationVaultExportServiceAbstraction,
  VaultExportService,
  VaultExportServiceAbstraction,
} from "@bitwarden/vault-export-core";

import { AuthStatusBadgeUpdaterService } from "../auth/services/auth-status-badge-updater.service";
import { OverlayNotificationsBackground as OverlayNotificationsBackgroundInterface } from "../autofill/background/abstractions/overlay-notifications.background";
import { OverlayBackground as OverlayBackgroundInterface } from "../autofill/background/abstractions/overlay.background";
import { AutoSubmitLoginBackground } from "../autofill/background/auto-submit-login.background";
import ContextMenusBackground from "../autofill/background/context-menus.background";
import NotificationBackground from "../autofill/background/notification.background";
import { OverlayNotificationsBackground } from "../autofill/background/overlay-notifications.background";
import { OverlayBackground } from "../autofill/background/overlay.background";
import TabsBackground from "../autofill/background/tabs.background";
import WebRequestBackground from "../autofill/background/web-request.background";
import { CipherContextMenuHandler } from "../autofill/browser/cipher-context-menu-handler";
import { ContextMenuClickedHandler } from "../autofill/browser/context-menu-clicked-handler";
import { MainContextMenuHandler } from "../autofill/browser/main-context-menu-handler";
import { Fido2Background as Fido2BackgroundAbstraction } from "../autofill/fido2/background/abstractions/fido2.background";
import { Fido2Background } from "../autofill/fido2/background/fido2.background";
import {
  BrowserFido2ParentWindowReference,
  BrowserFido2UserInterfaceService,
} from "../autofill/fido2/services/browser-fido2-user-interface.service";
import { AutofillService as AutofillServiceAbstraction } from "../autofill/services/abstractions/autofill.service";
import { AutofillBadgeUpdaterService } from "../autofill/services/autofill-badge-updater.service";
import AutofillService from "../autofill/services/autofill.service";
import { InlineMenuFieldQualificationService } from "../autofill/services/inline-menu-field-qualification.service";
import { SafariApp } from "../browser/safariApp";
import { BackgroundBrowserBiometricsService } from "../key-management/biometrics/background-browser-biometrics.service";
import VaultTimeoutService from "../key-management/vault-timeout/vault-timeout.service";
import { DefaultBadgeBrowserApi } from "../platform/badge/badge-browser-api";
import { BadgeService } from "../platform/badge/badge.service";
import { BrowserApi } from "../platform/browser/browser-api";
import { flagEnabled } from "../platform/flags";
import { IpcBackgroundService } from "../platform/ipc/ipc-background.service";
import { IpcContentScriptManagerService } from "../platform/ipc/ipc-content-script-manager.service";
/* eslint-disable no-restricted-imports */
import { ChromeMessageSender } from "../platform/messaging/chrome-message.sender";
/* eslint-enable no-restricted-imports */
import { OffscreenDocumentService } from "../platform/offscreen-document/abstractions/offscreen-document";
import { DefaultOffscreenDocumentService } from "../platform/offscreen-document/offscreen-document.service";
import { BrowserTaskSchedulerService } from "../platform/services/abstractions/browser-task-scheduler.service";
import { BrowserEnvironmentService } from "../platform/services/browser-environment.service";
import BrowserInitialInstallService from "../platform/services/browser-initial-install.service";
import BrowserLocalStorageService from "../platform/services/browser-local-storage.service";
import BrowserMemoryStorageService from "../platform/services/browser-memory-storage.service";
import { BrowserScriptInjectorService } from "../platform/services/browser-script-injector.service";
import I18nService from "../platform/services/i18n.service";
import { LocalBackedSessionStorageService } from "../platform/services/local-backed-session-storage.service";
import { BackgroundPlatformUtilsService } from "../platform/services/platform-utils/background-platform-utils.service";
import { BrowserPlatformUtilsService } from "../platform/services/platform-utils/browser-platform-utils.service";
import { PopupViewCacheBackgroundService } from "../platform/services/popup-view-cache-background.service";
import { BrowserSdkLoadService } from "../platform/services/sdk/browser-sdk-load.service";
import { BackgroundTaskSchedulerService } from "../platform/services/task-scheduler/background-task-scheduler.service";
import { BackgroundMemoryStorageService } from "../platform/storage/background-memory-storage.service";
import { BrowserStorageServiceProvider } from "../platform/storage/browser-storage-service.provider";
import { OffscreenStorageService } from "../platform/storage/offscreen-storage.service";
import { SyncServiceListener } from "../platform/sync/sync-service.listener";
import { fromChromeRuntimeMessaging } from "../platform/utils/from-chrome-runtime-messaging";
import { VaultFilterService } from "../vault/services/vault-filter.service";

import CommandsBackground from "./commands.background";
import IdleBackground from "./idle.background";
import { NativeMessagingBackground } from "./nativeMessaging.background";
import RuntimeBackground from "./runtime.background";

export default class MainBackground {
  messagingService: MessageSender;
  storageService: BrowserLocalStorageService;
  secureStorageService: AbstractStorageService;
  memoryStorageService: AbstractStorageService;
  memoryStorageForStateProviders: AbstractStorageService & ObservableStorageService;
  largeObjectMemoryStorageForStateProviders: AbstractStorageService & ObservableStorageService;
  i18nService: I18nServiceAbstraction;
  platformUtilsService: PlatformUtilsServiceAbstraction;
  logService: LogServiceAbstraction;
  keyGenerationService: KeyGenerationServiceAbstraction;
  keyService: KeyServiceAbstraction;
  cryptoFunctionService: CryptoFunctionServiceAbstraction;
  masterPasswordService: InternalMasterPasswordServiceAbstraction;
  tokenService: TokenServiceAbstraction;
  appIdService: AppIdServiceAbstraction;
  apiService: ApiServiceAbstraction;
  environmentService: BrowserEnvironmentService;
  cipherService: CipherServiceAbstraction;
  folderService: InternalFolderServiceAbstraction;
  userDecryptionOptionsService: InternalUserDecryptionOptionsServiceAbstraction;
  collectionService: CollectionService;
  vaultTimeoutService?: VaultTimeoutService;
  vaultTimeoutSettingsService: VaultTimeoutSettingsService;
  passwordGenerationService: PasswordGenerationServiceAbstraction;
  syncService: SyncService;
  passwordStrengthService: PasswordStrengthServiceAbstraction;
  totpService: TotpServiceAbstraction;
  autofillService: AutofillServiceAbstraction;
  containerService: ContainerService;
  auditService: AuditServiceAbstraction;
  authService: AuthServiceAbstraction;
  loginEmailService: LoginEmailServiceAbstraction;
  importApiService: ImportApiServiceAbstraction;
  importService: ImportServiceAbstraction;
  exportService: VaultExportServiceAbstraction;
  searchService: SearchServiceAbstraction;
  notificationsService: NotificationsService;
  stateService: StateServiceAbstraction;
  userNotificationSettingsService: UserNotificationSettingsServiceAbstraction;
  autofillSettingsService: AutofillSettingsServiceAbstraction;
  badgeSettingsService: BadgeSettingsServiceAbstraction;
  domainSettingsService: DomainSettingsService;
  systemService: SystemServiceAbstraction;
  processReloadService: ProcessReloadServiceAbstraction;
  eventCollectionService: EventCollectionServiceAbstraction;
  eventUploadService: EventUploadServiceAbstraction;
  policyService: InternalPolicyServiceAbstraction;
  sendService: InternalSendServiceAbstraction;
  sendStateProvider: SendStateProvider;
  fileUploadService: FileUploadServiceAbstraction;
  cipherFileUploadService: CipherFileUploadServiceAbstraction;
  organizationService: InternalOrganizationServiceAbstraction;
  providerService: ProviderServiceAbstraction;
  keyConnectorService: KeyConnectorServiceAbstraction;
  userVerificationService: UserVerificationServiceAbstraction;
  vaultFilterService: VaultFilterService;
  usernameGenerationService: UsernameGenerationServiceAbstraction;
  encryptService: EncryptService;
  folderApiService: FolderApiServiceAbstraction;
  policyApiService: PolicyApiServiceAbstraction;
  sendApiService: SendApiServiceAbstraction;
  userVerificationApiService: UserVerificationApiServiceAbstraction;
  fido2UserInterfaceService: Fido2UserInterfaceServiceAbstraction<BrowserFido2ParentWindowReference>;
  fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction<BrowserFido2ParentWindowReference>;
  fido2ActiveRequestManager: Fido2ActiveRequestManagerAbstraction;
  fido2ClientService: Fido2ClientServiceAbstraction<BrowserFido2ParentWindowReference>;
  avatarService: AvatarServiceAbstraction;
  mainContextMenuHandler: MainContextMenuHandler;
  cipherContextMenuHandler: CipherContextMenuHandler;
  configService: ConfigService;
  configApiService: ConfigApiServiceAbstraction;
  devicesApiService: DevicesApiServiceAbstraction;
  devicesService: DevicesServiceAbstraction;
  deviceTrustService: DeviceTrustServiceAbstraction;
  authRequestService: AuthRequestServiceAbstraction;
  authRequestApiService: AuthRequestApiServiceAbstraction;
  accountService: AccountServiceAbstraction;
  globalStateProvider: GlobalStateProvider;
  pinService: PinServiceAbstraction;
  singleUserStateProvider: SingleUserStateProvider;
  activeUserStateProvider: ActiveUserStateProvider;
  derivedStateProvider: DerivedStateProvider;
  stateProvider: StateProvider;
  taskSchedulerService: BrowserTaskSchedulerService;
  fido2Background: Fido2BackgroundAbstraction;
  individualVaultExportService: IndividualVaultExportServiceAbstraction;
  organizationVaultExportService: OrganizationVaultExportServiceAbstraction;
  vaultSettingsService: VaultSettingsServiceAbstraction;
  biometricStateService: BiometricStateService;
  biometricsService: BiometricsService;
  stateEventRunnerService: StateEventRunnerService;
  ssoLoginService: SsoLoginServiceAbstraction;
  billingAccountProfileStateService: BillingAccountProfileStateService;
  // eslint-disable-next-line rxjs/no-exposed-subjects -- Needed to give access to services module
  intraprocessMessagingSubject: Subject<Message<Record<string, unknown>>>;
  userAutoUnlockKeyService: UserAutoUnlockKeyService;
  scriptInjectorService: BrowserScriptInjectorService;
  kdfConfigService: KdfConfigService;
  offscreenDocumentService: OffscreenDocumentService;
  syncServiceListener: SyncServiceListener;
  browserInitialInstallService: BrowserInitialInstallService;
  backgroundSyncService: BackgroundSyncService;

  webPushConnectionService: WorkerWebPushConnectionService | UnsupportedWebPushConnectionService;
  themeStateService: DefaultThemeStateService;
  autoSubmitLoginBackground: AutoSubmitLoginBackground;
  sdkService: SdkService;
  sdkLoadService: SdkLoadService;
  cipherAuthorizationService: CipherAuthorizationService;
  endUserNotificationService: EndUserNotificationService;
  inlineMenuFieldQualificationService: InlineMenuFieldQualificationService;
  taskService: TaskService;
  cipherEncryptionService: CipherEncryptionService;
  private restrictedItemTypesService: RestrictedItemTypesService;

  ipcContentScriptManagerService: IpcContentScriptManagerService;
  ipcService: IpcService;

  badgeService: BadgeService;
  authStatusBadgeUpdaterService: AuthStatusBadgeUpdaterService;
  autofillBadgeUpdaterService: AutofillBadgeUpdaterService;

  onUpdatedRan: boolean;
  onReplacedRan: boolean;
  loginToAutoFill: CipherView = null;

  private commandsBackground: CommandsBackground;
  private contextMenusBackground: ContextMenusBackground;
  private idleBackground: IdleBackground;
  private notificationBackground: NotificationBackground;
  private overlayBackground: OverlayBackgroundInterface;
  private overlayNotificationsBackground: OverlayNotificationsBackgroundInterface;
  private runtimeBackground: RuntimeBackground;
  private tabsBackground: TabsBackground;
  private webRequestBackground: WebRequestBackground;

  private syncTimeout: any;
  private isSafari: boolean;
  private nativeMessagingBackground: NativeMessagingBackground;

  private popupViewCacheBackgroundService: PopupViewCacheBackgroundService;

  constructor() {
    // Services
    const lockedCallback = async (userId: UserId) => {
      await this.refreshMenu(true);
      if (this.systemService != null) {
        await this.systemService.clearPendingClipboard();
        await this.biometricsService.setShouldAutopromptNow(false);
        await this.processReloadService.startProcessReload(this.authService);
      }
    };

    const logoutCallback = async (logoutReason: LogoutReason, userId?: UserId) =>
      await this.logout(logoutReason, userId);

    const runtimeNativeMessagingBackground = () => this.nativeMessagingBackground;

    const refreshAccessTokenErrorCallback = () => {
      // Send toast to popup
      this.messagingService.send("showToast", {
        type: "error",
        title: this.i18nService.t("errorRefreshingAccessToken"),
        message: this.i18nService.t("errorRefreshingAccessTokenDesc"),
      });
    };

    const isDev = process.env.ENV === "development";
    this.logService = new ConsoleLogService(isDev);
    this.cryptoFunctionService = new WebCryptoFunctionService(self);
    this.keyGenerationService = new KeyGenerationService(this.cryptoFunctionService);
    this.storageService = new BrowserLocalStorageService(this.logService);

    this.intraprocessMessagingSubject = new Subject<Message<Record<string, unknown>>>();

    this.messagingService = MessageSender.combine(
      new SubjectMessageSender(this.intraprocessMessagingSubject),
      new ChromeMessageSender(this.logService),
    );

    const messageListener = new MessageListener(
      merge(
        this.intraprocessMessagingSubject.asObservable(), // For messages from the same context
        fromChromeRuntimeMessaging(), // For messages from other contexts
      ),
    );

    this.offscreenDocumentService = new DefaultOffscreenDocumentService(this.logService);

    this.platformUtilsService = new BackgroundPlatformUtilsService(
      this.messagingService,
      (clipboardValue, clearMs) => this.clearClipboard(clipboardValue, clearMs),
      self,
      this.offscreenDocumentService,
    );

    this.secureStorageService = this.storageService; // secure storage is not supported in browsers, so we use local storage and warn users when it is used

    if (BrowserApi.isManifestVersion(3)) {
      // manifest v3 can reuse the same storage. They are split for v2 due to lacking a good sync mechanism, which isn't true for v3
      this.memoryStorageForStateProviders = new BrowserMemoryStorageService(); // mv3 stores to storage.session
      this.memoryStorageService = this.memoryStorageForStateProviders;
    } else {
      this.memoryStorageForStateProviders = new BackgroundMemoryStorageService(); // mv2 stores to memory
      this.memoryStorageService = this.memoryStorageForStateProviders;
    }

    if (BrowserApi.isManifestVersion(3)) {
      // Creates a session key for mv3 storage of large memory items
      const sessionKey = new Lazy(async () => {
        // Key already in session storage
        const sessionStorage = new BrowserMemoryStorageService();
        const existingKey = await sessionStorage.get<SymmetricCryptoKey>("session-key");
        if (existingKey) {
          if (sessionStorage.valuesRequireDeserialization) {
            return SymmetricCryptoKey.fromJSON(existingKey);
          }
          return existingKey;
        }

        // New key
        const { derivedKey } = await this.keyGenerationService.createKeyWithPurpose(
          128,
          "ephemeral",
          "bitwarden-ephemeral",
        );
        await sessionStorage.save("session-key", derivedKey);
        return derivedKey;
      });

      this.largeObjectMemoryStorageForStateProviders = new LocalBackedSessionStorageService(
        sessionKey,
        this.storageService,
        // For local backed session storage, we expect that the encrypted data on disk will persist longer than the encryption key in memory
        // and failures to decrypt because of that are completely expected. For this reason, we pass in `false` to the `EncryptServiceImplementation`
        // so that MAC failures are not logged.
        new EncryptServiceImplementation(this.cryptoFunctionService, this.logService, false),
        this.platformUtilsService,
        this.logService,
      );
    } else {
      // mv2 stores to the same location
      this.largeObjectMemoryStorageForStateProviders = this.memoryStorageForStateProviders;
    }

    const localStorageStorageService = BrowserApi.isManifestVersion(3)
      ? new OffscreenStorageService(this.offscreenDocumentService)
      : new WindowStorageService(self.localStorage);

    const storageServiceProvider = new BrowserStorageServiceProvider(
      this.storageService,
      this.memoryStorageForStateProviders,
      this.largeObjectMemoryStorageForStateProviders,
      new PrimarySecondaryStorageService(this.storageService, localStorageStorageService),
    );

    this.globalStateProvider = new DefaultGlobalStateProvider(
      storageServiceProvider,
      this.logService,
    );

    const stateEventRegistrarService = new StateEventRegistrarService(
      this.globalStateProvider,
      storageServiceProvider,
    );

    this.stateEventRunnerService = new StateEventRunnerService(
      this.globalStateProvider,
      storageServiceProvider,
    );

    this.encryptService = new EncryptServiceImplementation(
      this.cryptoFunctionService,
      this.logService,
      true,
    );

    this.singleUserStateProvider = new DefaultSingleUserStateProvider(
      storageServiceProvider,
      stateEventRegistrarService,
      this.logService,
    );
    this.accountService = new AccountServiceImplementation(
      this.messagingService,
      this.logService,
      this.globalStateProvider,
      this.singleUserStateProvider,
    );
    this.activeUserStateProvider = new DefaultActiveUserStateProvider(
      new DefaultActiveUserAccessor(this.accountService),
      this.singleUserStateProvider,
    );
    this.derivedStateProvider = new InlineDerivedStateProvider();
    this.stateProvider = new DefaultStateProvider(
      this.activeUserStateProvider,
      this.singleUserStateProvider,
      this.globalStateProvider,
      this.derivedStateProvider,
    );

    this.taskSchedulerService = new BackgroundTaskSchedulerService(
      this.logService,
      this.stateProvider,
    );

    this.backgroundSyncService = new BackgroundSyncService(this.taskSchedulerService);
    this.backgroundSyncService.register(() => this.fullSync());

    this.environmentService = new BrowserEnvironmentService(
      this.logService,
      this.stateProvider,
      this.accountService,
      process.env.ADDITIONAL_REGIONS as unknown as RegionConfig[],
    );
    this.biometricStateService = new DefaultBiometricStateService(this.stateProvider);

    this.userNotificationSettingsService = new UserNotificationSettingsService(this.stateProvider);

    this.tokenService = new TokenService(
      this.singleUserStateProvider,
      this.globalStateProvider,
      this.platformUtilsService.supportsSecureStorage(),
      this.secureStorageService,
      this.keyGenerationService,
      this.encryptService,
      this.logService,
      logoutCallback,
    );

    this.popupViewCacheBackgroundService = new PopupViewCacheBackgroundService(
      messageListener,
      this.globalStateProvider,
      this.taskSchedulerService,
    );

    const migrationRunner = new MigrationRunner(
      this.storageService,
      this.logService,
      new MigrationBuilderService(),
      ClientType.Browser,
    );

    this.stateService = new StateService(
      this.storageService,
      this.secureStorageService,
      this.memoryStorageService,
      this.logService,
      new StateFactory(GlobalState, Account),
      this.accountService,
      this.environmentService,
      this.tokenService,
      migrationRunner,
    );

    this.masterPasswordService = new MasterPasswordService(
      this.stateProvider,
      this.stateService,
      this.keyGenerationService,
      this.encryptService,
      this.logService,
      this.cryptoFunctionService,
      this.accountService,
    );

    this.i18nService = new I18nService(BrowserApi.getUILanguage(), this.globalStateProvider);

    this.kdfConfigService = new DefaultKdfConfigService(this.stateProvider);

    this.pinService = new PinService(
      this.accountService,
      this.cryptoFunctionService,
      this.encryptService,
      this.kdfConfigService,
      this.keyGenerationService,
      this.logService,
      this.stateProvider,
    );

    this.keyService = new DefaultKeyService(
      this.pinService,
      this.masterPasswordService,
      this.keyGenerationService,
      this.cryptoFunctionService,
      this.encryptService,
      this.platformUtilsService,
      this.logService,
      this.stateService,
      this.accountService,
      this.stateProvider,
      this.kdfConfigService,
    );

    this.appIdService = new AppIdService(this.storageService, this.logService);

    this.userDecryptionOptionsService = new UserDecryptionOptionsService(this.stateProvider);
    this.organizationService = new DefaultOrganizationService(this.stateProvider);
    this.policyService = new DefaultPolicyService(this.stateProvider, this.organizationService);

    this.vaultTimeoutSettingsService = new DefaultVaultTimeoutSettingsService(
      this.accountService,
      this.pinService,
      this.userDecryptionOptionsService,
      this.keyService,
      this.tokenService,
      this.policyService,
      this.biometricStateService,
      this.stateProvider,
      this.logService,
      VaultTimeoutStringType.OnRestart, // default vault timeout
    );

    this.biometricsService = new BackgroundBrowserBiometricsService(
      runtimeNativeMessagingBackground,
      this.logService,
      this.keyService,
      this.biometricStateService,
      this.messagingService,
      this.vaultTimeoutSettingsService,
    );

    this.apiService = new ApiService(
      this.tokenService,
      this.platformUtilsService,
      this.environmentService,
      this.appIdService,
      refreshAccessTokenErrorCallback,
      this.logService,
      (logoutReason: LogoutReason, userId?: UserId) => this.logout(logoutReason, userId),
      this.vaultTimeoutSettingsService,
      { createRequest: (url, request) => new Request(url, request) },
    );

    this.fileUploadService = new FileUploadService(this.logService, this.apiService);
    this.cipherFileUploadService = new CipherFileUploadService(
      this.apiService,
      this.fileUploadService,
    );
    this.searchService = new SearchService(this.logService, this.i18nService, this.stateProvider);

    this.collectionService = new DefaultCollectionService(
      this.keyService,
      this.encryptService,
      this.i18nService,
      this.stateProvider,
    );

    this.badgeSettingsService = new BadgeSettingsService(this.stateProvider);
    this.policyApiService = new PolicyApiService(
      this.policyService,
      this.apiService,
      this.accountService,
    );
    this.keyConnectorService = new KeyConnectorService(
      this.accountService,
      this.masterPasswordService,
      this.keyService,
      this.apiService,
      this.tokenService,
      this.logService,
      this.organizationService,
      this.keyGenerationService,
      logoutCallback,
      this.stateProvider,
    );

    const sdkClientFactory = flagEnabled("sdk")
      ? new DefaultSdkClientFactory()
      : new NoopSdkClientFactory();
    this.sdkLoadService = new BrowserSdkLoadService(this.logService);
    this.sdkService = new DefaultSdkService(
      sdkClientFactory,
      this.environmentService,
      this.platformUtilsService,
      this.accountService,
      this.kdfConfigService,
      this.keyService,
    );

    this.passwordStrengthService = new PasswordStrengthService();

    this.passwordGenerationService = legacyPasswordGenerationServiceFactory(
      this.encryptService,
      this.keyService,
      this.policyService,
      this.accountService,
      this.stateProvider,
    );

    this.userDecryptionOptionsService = new UserDecryptionOptionsService(this.stateProvider);

    this.devicesApiService = new DevicesApiServiceImplementation(this.apiService);
    this.deviceTrustService = new DeviceTrustService(
      this.keyGenerationService,
      this.cryptoFunctionService,
      this.keyService,
      this.encryptService,
      this.appIdService,
      this.devicesApiService,
      this.i18nService,
      this.platformUtilsService,
      this.stateProvider,
      this.secureStorageService,
      this.userDecryptionOptionsService,
      this.logService,
      this.configService,
    );

    this.devicesService = new DevicesServiceImplementation(
      this.appIdService,
      this.devicesApiService,
      this.i18nService,
    );

    this.authRequestApiService = new DefaultAuthRequestApiService(this.apiService, this.logService);

    this.authRequestService = new AuthRequestService(
      this.appIdService,
      this.masterPasswordService,
      this.keyService,
      this.encryptService,
      this.apiService,
      this.stateProvider,
      this.authRequestApiService,
    );

    this.authService = new AuthService(
      this.accountService,
      this.messagingService,
      this.keyService,
      this.apiService,
      this.stateService,
      this.tokenService,
    );

    this.configApiService = new ConfigApiService(this.apiService, this.tokenService);

    this.configService = new DefaultConfigService(
      this.configApiService,
      this.environmentService,
      this.logService,
      this.stateProvider,
      this.authService,
    );

    this.billingAccountProfileStateService = new DefaultBillingAccountProfileStateService(
      this.stateProvider,
      this.platformUtilsService,
      this.apiService,
    );

    this.restrictedItemTypesService = new RestrictedItemTypesService(
      this.configService,
      this.accountService,
      this.organizationService,
      this.policyService,
    );

    this.autofillSettingsService = new AutofillSettingsService(
      this.stateProvider,
      this.policyService,
      this.accountService,
      this.restrictedItemTypesService,
    );

    this.ssoLoginService = new SsoLoginService(this.stateProvider, this.logService);

    this.userVerificationApiService = new UserVerificationApiService(this.apiService);

    this.domainSettingsService = new DefaultDomainSettingsService(
      this.stateProvider,
      this.configService,
    );

    this.themeStateService = new DefaultThemeStateService(this.globalStateProvider);

    this.cipherEncryptionService = new DefaultCipherEncryptionService(
      this.sdkService,
      this.logService,
    );

    this.cipherService = new CipherService(
      this.keyService,
      this.domainSettingsService,
      this.apiService,
      this.i18nService,
      this.searchService,
      this.stateService,
      this.autofillSettingsService,
      this.encryptService,
      this.cipherFileUploadService,
      this.configService,
      this.stateProvider,
      this.accountService,
      this.logService,
      this.cipherEncryptionService,
      this.messagingService,
    );
    this.folderService = new FolderService(
      this.keyService,
      this.encryptService,
      this.i18nService,
      this.cipherService,
      this.stateProvider,
    );
    this.folderApiService = new FolderApiService(this.folderService, this.apiService);

    this.userVerificationService = new UserVerificationService(
      this.keyService,
      this.accountService,
      this.masterPasswordService,
      this.i18nService,
      this.userVerificationApiService,
      this.userDecryptionOptionsService,
      this.pinService,
      this.kdfConfigService,
      this.biometricsService,
    );

    this.vaultFilterService = new VaultFilterService(
      this.organizationService,
      this.folderService,
      this.cipherService,
      this.collectionService,
      this.policyService,
      this.stateProvider,
      this.accountService,
      this.configService,
      this.i18nService,
    );

    this.vaultSettingsService = new VaultSettingsService(
      this.stateProvider,
      this.restrictedItemTypesService,
    );

    this.vaultTimeoutService = new VaultTimeoutService(
      this.accountService,
      this.masterPasswordService,
      this.cipherService,
      this.folderService,
      this.collectionService,
      this.platformUtilsService,
      this.messagingService,
      this.searchService,
      this.stateService,
      this.authService,
      this.vaultTimeoutSettingsService,
      this.stateEventRunnerService,
      this.taskSchedulerService,
      this.logService,
      this.biometricsService,
      lockedCallback,
      logoutCallback,
    );
    this.containerService = new ContainerService(this.keyService, this.encryptService);

    this.sendStateProvider = new SendStateProvider(this.stateProvider);
    this.sendService = new SendService(
      this.keyService,
      this.i18nService,
      this.keyGenerationService,
      this.sendStateProvider,
      this.encryptService,
    );
    this.sendApiService = new SendApiService(
      this.apiService,
      this.fileUploadService,
      this.sendService,
    );

    this.avatarService = new AvatarService(this.apiService, this.stateProvider);

    this.providerService = new ProviderService(this.stateProvider);

    this.syncService = new DefaultSyncService(
      this.masterPasswordService,
      this.accountService,
      this.apiService,
      this.domainSettingsService,
      this.folderService,
      this.cipherService,
      this.keyService,
      this.collectionService,
      this.messagingService,
      this.policyService,
      this.sendService,
      this.logService,
      this.keyConnectorService,
      this.stateService,
      this.providerService,
      this.folderApiService,
      this.organizationService,
      this.sendApiService,
      this.userDecryptionOptionsService,
      this.avatarService,
      logoutCallback,
      this.billingAccountProfileStateService,
      this.tokenService,
      this.authService,
      this.stateProvider,
    );

    this.syncServiceListener = new SyncServiceListener(
      this.syncService,
      messageListener,
      this.messagingService,
      this.logService,
    );

    this.eventUploadService = new EventUploadService(
      this.apiService,
      this.stateProvider,
      this.logService,
      this.authService,
      this.taskSchedulerService,
    );
    this.eventCollectionService = new EventCollectionService(
      this.cipherService,
      this.stateProvider,
      this.organizationService,
      this.eventUploadService,
      this.authService,
      this.accountService,
    );
    this.totpService = new TotpService(this.sdkService);

    this.scriptInjectorService = new BrowserScriptInjectorService(
      this.domainSettingsService,
      this.platformUtilsService,
      this.logService,
    );
    this.autofillService = new AutofillService(
      this.cipherService,
      this.autofillSettingsService,
      this.totpService,
      this.eventCollectionService,
      this.logService,
      this.domainSettingsService,
      this.userVerificationService,
      this.billingAccountProfileStateService,
      this.scriptInjectorService,
      this.accountService,
      this.authService,
      this.configService,
      this.userNotificationSettingsService,
      messageListener,
    );
    this.auditService = new AuditService(this.cryptoFunctionService, this.apiService);

    this.importApiService = new ImportApiService(this.apiService);

    this.importService = new ImportService(
      this.cipherService,
      this.folderService,
      this.importApiService,
      this.i18nService,
      this.collectionService,
      this.keyService,
      this.encryptService,
      this.pinService,
      this.accountService,
      this.sdkService,
      this.restrictedItemTypesService,
    );

    this.individualVaultExportService = new IndividualVaultExportService(
      this.folderService,
      this.cipherService,
      this.pinService,
      this.keyService,
      this.encryptService,
      this.cryptoFunctionService,
      this.kdfConfigService,
      this.accountService,
      this.apiService,
      this.restrictedItemTypesService,
    );

    this.organizationVaultExportService = new OrganizationVaultExportService(
      this.cipherService,
      this.apiService,
      this.pinService,
      this.keyService,
      this.encryptService,
      this.cryptoFunctionService,
      this.collectionService,
      this.kdfConfigService,
      this.accountService,
      this.restrictedItemTypesService,
    );

    this.exportService = new VaultExportService(
      this.individualVaultExportService,
      this.organizationVaultExportService,
    );

    this.browserInitialInstallService = new BrowserInitialInstallService(this.stateProvider);

    if (BrowserApi.isManifestVersion(3)) {
      const registration = (self as unknown as { registration: ServiceWorkerRegistration })
        ?.registration;

      if (registration != null) {
        this.webPushConnectionService = new WorkerWebPushConnectionService(
          this.configService,
          new WebPushNotificationsApiService(this.apiService, this.appIdService),
          registration,
          this.stateProvider,
        );
      } else {
        this.webPushConnectionService = new UnsupportedWebPushConnectionService();
      }
    } else {
      this.webPushConnectionService = new UnsupportedWebPushConnectionService();
    }

    this.notificationsService = new DefaultNotificationsService(
      this.logService,
      this.syncService,
      this.appIdService,
      this.environmentService,
      logoutCallback,
      this.messagingService,
      this.accountService,
      new SignalRConnectionService(this.apiService, this.logService),
      this.authService,
      this.webPushConnectionService,
    );

    this.fido2UserInterfaceService = new BrowserFido2UserInterfaceService(this.authService);
    this.fido2AuthenticatorService = new Fido2AuthenticatorService(
      this.cipherService,
      this.fido2UserInterfaceService,
      this.syncService,
      this.accountService,
      this.logService,
    );
    this.fido2ActiveRequestManager = new Fido2ActiveRequestManager();
    this.fido2ClientService = new Fido2ClientService(
      this.fido2AuthenticatorService,
      this.configService,
      this.authService,
      this.vaultSettingsService,
      this.domainSettingsService,
      this.taskSchedulerService,
      this.fido2ActiveRequestManager,
      this.logService,
    );

    const systemUtilsServiceReloadCallback = async () => {
      await this.taskSchedulerService.clearAllScheduledTasks();
      BrowserApi.reloadExtension();
    };

    this.systemService = new SystemService(
      this.platformUtilsService,
      this.autofillSettingsService,
      this.taskSchedulerService,
    );

    this.processReloadService = new DefaultProcessReloadService(
      this.pinService,
      this.messagingService,
      systemUtilsServiceReloadCallback,
      this.vaultTimeoutSettingsService,
      this.biometricStateService,
      this.accountService,
      this.logService,
    );

    // Other fields
    this.isSafari = this.platformUtilsService.isSafari();

    // Background

    this.fido2Background = new Fido2Background(
      this.logService,
      this.fido2ActiveRequestManager,
      this.fido2ClientService,
      this.vaultSettingsService,
      this.scriptInjectorService,
      this.authService,
    );

    const lockService = new DefaultLockService(this.accountService, this.vaultTimeoutService);

    this.runtimeBackground = new RuntimeBackground(
      this,
      this.autofillService,
      this.platformUtilsService as BrowserPlatformUtilsService,
      this.notificationsService,
      this.autofillSettingsService,
      this.processReloadService,
      this.environmentService,
      this.messagingService,
      this.logService,
      this.configService,
      messageListener,
      this.accountService,
      lockService,
      this.billingAccountProfileStateService,
      this.browserInitialInstallService,
    );
    this.nativeMessagingBackground = new NativeMessagingBackground(
      this.keyService,
      this.encryptService,
      this.cryptoFunctionService,
      this.runtimeBackground,
      this.messagingService,
      this.appIdService,
      this.platformUtilsService,
      this.logService,
      this.authService,
      this.biometricStateService,
      this.accountService,
    );
    this.commandsBackground = new CommandsBackground(
      this,
      this.platformUtilsService,
      this.vaultTimeoutService,
      this.authService,
      () => this.generatePasswordToClipboard(),
    );

    this.taskService = new DefaultTaskService(
      this.stateProvider,
      this.apiService,
      this.organizationService,
      this.authService,
      this.notificationsService,
      messageListener,
    );

    this.notificationBackground = new NotificationBackground(
      this.accountService,
      this.authService,
      this.autofillService,
      this.cipherService,
      this.collectionService,
      this.configService,
      this.domainSettingsService,
      this.environmentService,
      this.folderService,
      this.logService,
      this.organizationService,
      this.policyService,
      this.themeStateService,
      this.userNotificationSettingsService,
      this.taskService,
      this.messagingService,
    );

    this.overlayNotificationsBackground = new OverlayNotificationsBackground(
      this.logService,
      this.notificationBackground,
    );

    this.autoSubmitLoginBackground = new AutoSubmitLoginBackground(
      this.logService,
      this.autofillService,
      this.scriptInjectorService,
      this.authService,
      this.platformUtilsService,
      this.policyService,
      this.accountService,
    );

    const contextMenuClickedHandler = new ContextMenuClickedHandler(
      (options) => this.platformUtilsService.copyToClipboard(options.text),
      async (_tab) => {
        const options = (await this.passwordGenerationService.getOptions())?.[0] ?? {};
        const password = await this.passwordGenerationService.generatePassword(options);
        this.platformUtilsService.copyToClipboard(password);
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.passwordGenerationService.addHistory(password);
      },
      async (tab, cipher) => {
        this.loginToAutoFill = cipher;
        if (tab == null) {
          return;
        }

        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        BrowserApi.tabSendMessage(tab, {
          command: "collectPageDetails",
          tab: tab,
          sender: "contextMenu",
        });
      },
      this.authService,
      this.cipherService,
      this.totpService,
      this.eventCollectionService,
      this.userVerificationService,
      this.accountService,
    );

    this.contextMenusBackground = new ContextMenusBackground(contextMenuClickedHandler);

    this.idleBackground = new IdleBackground(
      this.vaultTimeoutService,
      this.notificationsService,
      this.accountService,
      this.vaultTimeoutSettingsService,
    );

    this.usernameGenerationService = legacyUsernameGenerationServiceFactory(
      this.apiService,
      this.i18nService,
      this.keyService,
      this.encryptService,
      this.policyService,
      this.accountService,
      this.stateProvider,
    );

    this.mainContextMenuHandler = new MainContextMenuHandler(
      this.stateService,
      this.autofillSettingsService,
      this.i18nService,
      this.logService,
      this.billingAccountProfileStateService,
      this.accountService,
      this.restrictedItemTypesService,
    );

    this.cipherContextMenuHandler = new CipherContextMenuHandler(
      this.mainContextMenuHandler,
      this.authService,
      this.cipherService,
      this.accountService,
    );

    if (chrome.webRequest != null && chrome.webRequest.onAuthRequired != null) {
      this.webRequestBackground = new WebRequestBackground(
        this.platformUtilsService,
        this.cipherService,
        this.authService,
        this.accountService,
        chrome.webRequest,
      );
    }

    this.userAutoUnlockKeyService = new UserAutoUnlockKeyService(this.keyService);

    this.cipherAuthorizationService = new DefaultCipherAuthorizationService(
      this.collectionService,
      this.organizationService,
      this.accountService,
    );

    this.inlineMenuFieldQualificationService = new InlineMenuFieldQualificationService();

    this.ipcContentScriptManagerService = new IpcContentScriptManagerService(this.configService);
    this.ipcService = new IpcBackgroundService(this.platformUtilsService, this.logService);

    this.endUserNotificationService = new DefaultEndUserNotificationService(
      this.stateProvider,
      this.apiService,
      this.notificationsService,
      this.authService,
      this.logService,
    );

    this.badgeService = new BadgeService(
      this.stateProvider,
      new DefaultBadgeBrowserApi(this.platformUtilsService),
      this.logService,
    );
    this.authStatusBadgeUpdaterService = new AuthStatusBadgeUpdaterService(
      this.badgeService,
      this.accountService,
      this.authService,
    );
  }

  async bootstrap() {
    if (this.webPushConnectionService instanceof WorkerWebPushConnectionService) {
      this.webPushConnectionService.start();
    }
    this.containerService.attachToGlobal(self);

    await this.sdkLoadService.loadAndInit();
    // Only the "true" background should run migrations
    await this.stateService.init({ runMigrations: true });

    // This is here instead of in in the InitService b/c we don't plan for
    // side effects to run in the Browser InitService.
    const accounts = await firstValueFrom(this.accountService.accounts$);

    const setUserKeyInMemoryPromises = [];
    for (const userId of Object.keys(accounts) as UserId[]) {
      // For each acct, we must await the process of setting the user key in memory
      // if the auto user key is set to avoid race conditions of any code trying to access
      // the user key from mem.
      setUserKeyInMemoryPromises.push(
        this.userAutoUnlockKeyService.setUserKeyInMemoryIfAutoUserKeySet(userId),
      );
    }
    await Promise.all(setUserKeyInMemoryPromises);

    await (this.i18nService as I18nService).init();
    (this.eventUploadService as EventUploadService).init(true);

    this.popupViewCacheBackgroundService.startObservingMessages();

    await this.vaultTimeoutService.init(true);
    this.fido2Background.init();
    await this.runtimeBackground.init();
    await this.notificationBackground.init();
    this.overlayNotificationsBackground.init();
    this.commandsBackground.init();
    this.contextMenusBackground?.init();
    this.idleBackground.init();
    this.webRequestBackground?.startListening();
    this.syncServiceListener?.listener$().subscribe();
    await this.autoSubmitLoginBackground.init();

    // If the user is logged out, switch to the next account
    const active = await firstValueFrom(this.accountService.activeAccount$);
    if (active != null) {
      const authStatus = await firstValueFrom(
        this.authService.authStatuses$.pipe(map((statuses) => statuses[active.id])),
      );
      if (authStatus === AuthenticationStatus.LoggedOut) {
        const nextUpAccount = await firstValueFrom(this.accountService.nextUpAccount$);
        await this.switchAccount(nextUpAccount?.id);
      }
    }

    await this.initOverlayAndTabsBackground();
    await this.ipcService.init();
    this.badgeService.startListening();

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await this.fullSync(false);
        this.backgroundSyncService.init();
        this.notificationsService.startListening();

        this.taskService.listenForTaskNotifications();
        this.endUserNotificationService.listenForEndUserNotifications();
        resolve();
      }, 500);
    });
  }

  async refreshMenu(forLocked = false) {
    if (!chrome.windows || !chrome.contextMenus) {
      return;
    }

    await MainContextMenuHandler.removeAll();

    if (forLocked) {
      await this.mainContextMenuHandler?.noAccess();
      this.onUpdatedRan = this.onReplacedRan = false;
      return;
    }

    const contextMenuIsEnabled = await this.mainContextMenuHandler?.init();
    if (!contextMenuIsEnabled) {
      this.onUpdatedRan = this.onReplacedRan = false;
      return;
    }

    const tab = await BrowserApi.getTabFromCurrentWindow();

    if (tab) {
      const currentUrlIsBlocked = await firstValueFrom(
        this.domainSettingsService.blockedInteractionsUris$.pipe(
          map((blockedInteractionsUrls) => {
            if (blockedInteractionsUrls && tab?.url?.length) {
              return isUrlInList(tab.url, blockedInteractionsUrls);
            }

            return false;
          }),
        ),
      );

      await this.cipherContextMenuHandler?.update(tab.url, currentUrlIsBlocked);
      this.onUpdatedRan = this.onReplacedRan = false;
    }
  }

  async updateOverlayCiphers() {
    // `overlayBackground` is null in popup only contexts
    if (this.overlayBackground) {
      await this.overlayBackground.updateOverlayCiphers();
    }
  }

  /**
   * Switch accounts to indicated userId -- null is no active user
   */
  async switchAccount(userId: UserId) {
    let nextAccountStatus: AuthenticationStatus;
    try {
      // HACK to ensure account is switched before proceeding
      const switchPromise = firstValueFrom(
        this.accountService.activeAccount$.pipe(
          filter((account) => (account?.id ?? null) === (userId ?? null)),
          timeout({
            first: 1_000,
            with: () => {
              throw new Error(
                "The account switch process did not complete in a reasonable amount of time.",
              );
            },
          }),
        ),
      );
      await this.popupViewCacheBackgroundService.clearState();
      await this.accountService.switchAccount(userId);
      await switchPromise;

      if (userId == null) {
        await this.refreshMenu();
        await this.updateOverlayCiphers();
        this.messagingService.send("goHome");
        return;
      }

      nextAccountStatus = await this.authService.getAuthStatus(userId);

      await this.systemService.clearPendingClipboard();

      if (nextAccountStatus === AuthenticationStatus.LoggedOut) {
        this.messagingService.send("goHome");
      } else if (nextAccountStatus === AuthenticationStatus.Locked) {
        this.messagingService.send("locked", { userId: userId });
      } else {
        this.messagingService.send("unlocked", { userId: userId });
        await this.refreshMenu();
        await this.updateOverlayCiphers();
        await this.syncService.fullSync(false);
      }
    } finally {
      this.messagingService.send("switchAccountFinish", {
        userId: userId,
        status: nextAccountStatus,
      });
    }
  }

  // TODO: PM-21212 - consolidate the logic of this method into the new ExtensionLogoutService
  async logout(logoutReason: LogoutReason, userId?: UserId) {
    const activeUserId = await firstValueFrom(
      this.accountService.activeAccount$.pipe(
        map((a) => a?.id),
        timeout({
          first: 2000,
          with: () => {
            throw new Error("No active account found to logout");
          },
        }),
      ),
    );

    const userBeingLoggedOut = userId ?? activeUserId;

    await this.eventUploadService.uploadEvents(userBeingLoggedOut);

    const newActiveUser =
      userBeingLoggedOut === activeUserId
        ? await firstValueFrom(this.accountService.nextUpAccount$.pipe(map((a) => a?.id)))
        : null;

    await this.switchAccount(newActiveUser);

    // HACK: We shouldn't wait for the authentication status to change but instead subscribe to the
    // authentication status to do various actions.
    const logoutPromise = firstValueFrom(
      this.authService.authStatusFor$(userBeingLoggedOut).pipe(
        filter((authenticationStatus) => authenticationStatus === AuthenticationStatus.LoggedOut),
        timeout({
          first: 5_000,
          with: () => {
            throw new Error("The logout process did not complete in a reasonable amount of time.");
          },
        }),
      ),
    );

    await Promise.all([
      this.keyService.clearKeys(userBeingLoggedOut),
      this.cipherService.clear(userBeingLoggedOut),
      this.folderService.clear(userBeingLoggedOut),
      this.vaultTimeoutSettingsService.clear(userBeingLoggedOut),
      this.vaultFilterService.clear(),
      this.biometricStateService.logout(userBeingLoggedOut),
      this.popupViewCacheBackgroundService.clearState(),
      /* We intentionally do not clear:
       *  - autofillSettingsService
       *  - badgeSettingsService
       *  - userNotificationSettingsService
       */
    ]);

    //Needs to be checked before state is cleaned
    const needStorageReseed = await this.needsStorageReseed(userBeingLoggedOut);

    await this.stateService.clean({ userId: userBeingLoggedOut });
    await this.accountService.clean(userBeingLoggedOut);

    await this.stateEventRunnerService.handleEvent("logout", userBeingLoggedOut);

    // HACK: Wait for the user logging outs authentication status to transition to LoggedOut
    await logoutPromise;

    this.messagingService.send("doneLoggingOut", {
      logoutReason: logoutReason,
      userId: userBeingLoggedOut,
    });

    if (needStorageReseed) {
      await this.reseedStorage();
    }

    if (BrowserApi.isManifestVersion(3)) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.sendMessage("updateBadge");
    }
    await this.mainContextMenuHandler?.noAccess();
    await this.systemService.clearPendingClipboard();
    await this.processReloadService.startProcessReload(this.authService);
  }

  private async needsStorageReseed(userId: UserId): Promise<boolean> {
    const currentVaultTimeout = await firstValueFrom(
      this.vaultTimeoutSettingsService.getVaultTimeoutByUserId$(userId),
    );
    return currentVaultTimeout == VaultTimeoutStringType.Never ? false : true;
  }

  async collectPageDetailsForContentScript(tab: any, sender: string, frameId: number = null) {
    if (tab == null || !tab.id) {
      return;
    }

    const options: any = {};
    if (frameId != null) {
      options.frameId = frameId;
    }

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserApi.tabSendMessage(
      tab,
      {
        command: "collectPageDetails",
        tab: tab,
        sender: sender,
      },
      options,
    );
  }

  async openPopup() {
    const browserAction = BrowserApi.getBrowserAction();

    if ("openPopup" in browserAction && typeof browserAction.openPopup === "function") {
      await browserAction.openPopup();
      return;
    }

    if (this.isSafari) {
      await SafariApp.sendMessageToApp("showPopover", null, true);
    }
  }

  /** Opens the `/at-risk-passwords` page within the popup */
  async openAtRisksPasswordsPage() {
    const browserAction = BrowserApi.getBrowserAction();

    try {
      // Set route of the popup before attempting to open it.
      // If the vault is locked, this won't have an effect as the auth guards will
      // redirect the user to the login page.
      await browserAction.setPopup({ popup: ExtensionPageUrls.AtRiskPasswords });

      await this.openPopup();
    } finally {
      // Reset the popup route to the default route so any subsequent
      // popup openings will not open to the at-risk-passwords page.
      await browserAction.setPopup({
        popup: ExtensionPageUrls.Index,
      });
    }
  }

  /**
   * Opens the popup to the given page
   * @default ExtensionPageUrls.Index
   */
  async openTheExtensionToPage(url: ExtensionPageUrls = ExtensionPageUrls.Index) {
    const isValidUrl = Object.values(ExtensionPageUrls).includes(url);

    // If a non-defined URL is provided, return early.
    if (!isValidUrl) {
      return;
    }

    const browserAction = BrowserApi.getBrowserAction();

    try {
      // Set route of the popup before attempting to open it.
      // If the vault is locked, this won't have an effect as the auth guards will
      // redirect the user to the login page.
      await browserAction.setPopup({ popup: url });

      await this.openPopup();
    } finally {
      // Reset the popup route to the default route so any subsequent
      // popup openings will not open to the at-risk-passwords page.
      await browserAction.setPopup({
        popup: ExtensionPageUrls.Index,
      });
    }
  }

  async reseedStorage() {
    if (
      !this.platformUtilsService.isChrome() &&
      !this.platformUtilsService.isVivaldi() &&
      !this.platformUtilsService.isOpera()
    ) {
      return;
    }

    await this.storageService.fillBuffer();
  }

  async clearClipboard(clipboardValue: string, clearMs: number) {
    if (this.systemService != null) {
      await this.systemService.clearClipboard(clipboardValue, clearMs);
    }
  }

  private async fullSync(override = false) {
    const syncInternal = 6 * 60 * 60 * 1000; // 6 hours
    const lastSync = await this.syncService.getLastSync();

    let lastSyncAgo = syncInternal + 1;
    if (lastSync != null) {
      lastSyncAgo = new Date().getTime() - lastSync.getTime();
    }

    if (override || lastSyncAgo >= syncInternal) {
      await this.syncService.fullSync(override);
    }
  }

  /**
   * Temporary solution to handle initialization of the overlay background behind a feature flag.
   * Will be reverted to instantiation within the constructor once the feature flag is removed.
   */
  async initOverlayAndTabsBackground() {
    if (
      this.overlayBackground ||
      this.tabsBackground ||
      (await firstValueFrom(this.authService.activeAccountStatus$)) ===
        AuthenticationStatus.LoggedOut
    ) {
      return;
    }

    this.overlayBackground = new OverlayBackground(
      this.logService,
      this.cipherService,
      this.autofillService,
      this.authService,
      this.environmentService,
      this.domainSettingsService,
      this.autofillSettingsService,
      this.i18nService,
      this.platformUtilsService,
      this.vaultSettingsService,
      this.fido2ActiveRequestManager,
      this.inlineMenuFieldQualificationService,
      this.themeStateService,
      this.totpService,
      this.accountService,
      () => this.generatePassword(),
      (password) => this.addPasswordToHistory(password),
    );

    this.autofillBadgeUpdaterService = new AutofillBadgeUpdaterService(
      this.badgeService,
      this.accountService,
      this.cipherService,
      this.badgeSettingsService,
      this.logService,
    );

    this.tabsBackground = new TabsBackground(
      this,
      this.notificationBackground,
      this.overlayBackground,
    );

    await this.overlayBackground.init();
    await this.tabsBackground.init();
    await this.autofillBadgeUpdaterService.init();
  }

  generatePassword = async (): Promise<string> => {
    const options = (await this.passwordGenerationService.getOptions())?.[0] ?? {};
    return await this.passwordGenerationService.generatePassword(options);
  };

  generatePasswordToClipboard = async () => {
    const password = await this.generatePassword();
    this.platformUtilsService.copyToClipboard(password);
    await this.addPasswordToHistory(password);
  };

  addPasswordToHistory = async (password: string) => {
    await this.passwordGenerationService.addHistory(password);
  };
}
