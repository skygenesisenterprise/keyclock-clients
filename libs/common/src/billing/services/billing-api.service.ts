// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore

import { TaxInfoResponse } from "@bitwarden/common/billing/models/response/tax-info.response";

import { ApiService } from "../../abstractions/api.service";
import { OrganizationCreateRequest } from "../../admin-console/models/request/organization-create.request";
import { ProviderOrganizationOrganizationDetailsResponse } from "../../admin-console/models/response/provider/provider-organization.response";
import { ListResponse } from "../../models/response/list.response";
import { BillingApiServiceAbstraction } from "../abstractions";
import { PaymentMethodType } from "../enums";
import { CreateClientOrganizationRequest } from "../models/request/create-client-organization.request";
import { ExpandedTaxInfoUpdateRequest } from "../models/request/expanded-tax-info-update.request";
import { SubscriptionCancellationRequest } from "../models/request/subscription-cancellation.request";
import { UpdateClientOrganizationRequest } from "../models/request/update-client-organization.request";
import { UpdatePaymentMethodRequest } from "../models/request/update-payment-method.request";
import { VerifyBankAccountRequest } from "../models/request/verify-bank-account.request";
import { InvoicesResponse } from "../models/response/invoices.response";
import { OrganizationBillingMetadataResponse } from "../models/response/organization-billing-metadata.response";
import { PaymentMethodResponse } from "../models/response/payment-method.response";
import { PlanResponse } from "../models/response/plan.response";
import { ProviderSubscriptionResponse } from "../models/response/provider-subscription-response";

export class BillingApiService implements BillingApiServiceAbstraction {
  constructor(private apiService: ApiService) {}

  cancelOrganizationSubscription(
    organizationId: string,
    request: SubscriptionCancellationRequest,
  ): Promise<void> {
    return this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/cancel",
      request,
      true,
      false,
    );
  }

  cancelPremiumUserSubscription(request: SubscriptionCancellationRequest): Promise<void> {
    return this.apiService.send("POST", "/accounts/cancel", request, true, false);
  }

  createProviderClientOrganization(
    providerId: string,
    request: CreateClientOrganizationRequest,
  ): Promise<void> {
    return this.apiService.send(
      "POST",
      "/providers/" + providerId + "/clients",
      request,
      true,
      false,
    );
  }

  async createSetupIntent(type: PaymentMethodType) {
    const getPath = () => {
      switch (type) {
        case PaymentMethodType.BankAccount: {
          return "/setup-intent/bank-account";
        }
        case PaymentMethodType.Card: {
          return "/setup-intent/card";
        }
      }
    };
    const response = await this.apiService.send("POST", getPath(), null, true, true);
    return response as string;
  }

  async getOrganizationBillingMetadata(
    organizationId: string,
  ): Promise<OrganizationBillingMetadataResponse> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/billing/metadata",
      null,
      true,
      true,
    );

    return new OrganizationBillingMetadataResponse(r);
  }

  async getOrganizationPaymentMethod(organizationId: string): Promise<PaymentMethodResponse> {
    const response = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/billing/payment-method",
      null,
      true,
      true,
    );
    return new PaymentMethodResponse(response);
  }

  async getPlans(): Promise<ListResponse<PlanResponse>> {
    const r = await this.apiService.send("GET", "/plans", null, false, true);
    return new ListResponse(r, PlanResponse);
  }

  async getProviderClientInvoiceReport(providerId: string, invoiceId: string): Promise<string> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/billing/invoices/" + invoiceId,
      null,
      true,
      true,
    );
    return response as string;
  }

  async getProviderClientOrganizations(
    providerId: string,
  ): Promise<ListResponse<ProviderOrganizationOrganizationDetailsResponse>> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/organizations",
      null,
      true,
      true,
    );
    return new ListResponse(response, ProviderOrganizationOrganizationDetailsResponse);
  }

  async getProviderInvoices(providerId: string): Promise<InvoicesResponse> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/billing/invoices",
      null,
      true,
      true,
    );
    return new InvoicesResponse(response);
  }

  async getProviderSubscription(providerId: string): Promise<ProviderSubscriptionResponse> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/billing/subscription",
      null,
      true,
      true,
    );
    return new ProviderSubscriptionResponse(response);
  }

  async getProviderTaxInformation(providerId: string): Promise<TaxInfoResponse> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/billing/tax-information",
      null,
      true,
      true,
    );
    return new TaxInfoResponse(response);
  }

  async updateOrganizationPaymentMethod(
    organizationId: string,
    request: UpdatePaymentMethodRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "PUT",
      "/organizations/" + organizationId + "/billing/payment-method",
      request,
      true,
      false,
    );
  }

  async updateOrganizationTaxInformation(
    organizationId: string,
    request: ExpandedTaxInfoUpdateRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "PUT",
      "/organizations/" + organizationId + "/billing/tax-information",
      request,
      true,
      false,
    );
  }

  async updateProviderClientOrganization(
    providerId: string,
    organizationId: string,
    request: UpdateClientOrganizationRequest,
  ): Promise<any> {
    return await this.apiService.send(
      "PUT",
      "/providers/" + providerId + "/clients/" + organizationId,
      request,
      true,
      false,
    );
  }

  async updateProviderPaymentMethod(
    providerId: string,
    request: UpdatePaymentMethodRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "PUT",
      "/providers/" + providerId + "/billing/payment-method",
      request,
      true,
      false,
    );
  }

  async updateProviderTaxInformation(providerId: string, request: ExpandedTaxInfoUpdateRequest) {
    return await this.apiService.send(
      "PUT",
      "/providers/" + providerId + "/billing/tax-information",
      request,
      true,
      false,
    );
  }

  async verifyOrganizationBankAccount(
    organizationId: string,
    request: VerifyBankAccountRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/billing/payment-method/verify-bank-account",
      request,
      true,
      false,
    );
  }

  async verifyProviderBankAccount(
    providerId: string,
    request: VerifyBankAccountRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "POST",
      "/providers/" + providerId + "/billing/payment-method/verify-bank-account",
      request,
      true,
      false,
    );
  }

  async restartSubscription(
    organizationId: string,
    request: OrganizationCreateRequest,
  ): Promise<void> {
    return await this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/billing/restart-subscription",
      request,
      true,
      false,
    );
  }
}
