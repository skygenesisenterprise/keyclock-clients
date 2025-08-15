import { AddableOrganizationResponse } from "@bitwarden/common/admin-console/models/response/addable-organization.response";

import { ApiService } from "../../../abstractions/api.service";
import { ProviderApiServiceAbstraction } from "../../abstractions/provider/provider-api.service.abstraction";
import { ProviderSetupRequest } from "../../models/request/provider/provider-setup.request";
import { ProviderUpdateRequest } from "../../models/request/provider/provider-update.request";
import { ProviderVerifyRecoverDeleteRequest } from "../../models/request/provider/provider-verify-recover-delete.request";
import { ProviderResponse } from "../../models/response/provider/provider.response";

export class ProviderApiService implements ProviderApiServiceAbstraction {
  constructor(private apiService: ApiService) {}
  async postProviderSetup(id: string, request: ProviderSetupRequest) {
    const r = await this.apiService.send(
      "POST",
      "/providers/" + id + "/setup",
      request,
      true,
      true,
    );
    return new ProviderResponse(r);
  }

  async getProvider(id: string) {
    const r = await this.apiService.send("GET", "/providers/" + id, null, true, true);
    return new ProviderResponse(r);
  }

  async putProvider(id: string, request: ProviderUpdateRequest) {
    const r = await this.apiService.send("PUT", "/providers/" + id, request, true, true);
    return new ProviderResponse(r);
  }

  providerRecoverDeleteToken(
    providerId: string,
    request: ProviderVerifyRecoverDeleteRequest,
  ): Promise<any> {
    return this.apiService.send(
      "POST",
      "/providers/" + providerId + "/delete-recover-token",
      request,
      false,
      false,
    );
  }

  async deleteProvider(id: string): Promise<void> {
    await this.apiService.send("DELETE", "/providers/" + id, null, true, false);
  }

  async getProviderAddableOrganizations(
    providerId: string,
  ): Promise<AddableOrganizationResponse[]> {
    const response = await this.apiService.send(
      "GET",
      "/providers/" + providerId + "/clients/addable",
      null,
      true,
      true,
    );

    return response.map((data: any) => new AddableOrganizationResponse(data));
  }

  addOrganizationToProvider(
    providerId: string,
    request: {
      key: string;
      organizationId: string;
    },
  ): Promise<void> {
    return this.apiService.send(
      "POST",
      "/providers/" + providerId + "/clients/existing",
      request,
      true,
      false,
    );
  }
}
