import { BaseResponse } from "@bitwarden/common/models/response/base.response";

export class MemberCipherDetailsResponse extends BaseResponse {
  userGuid: string;
  userName: string;
  email: string;
  useKeyConnector: boolean;
  cipherIds: string[] = [];

  constructor(response: any) {
    super(response);
    this.userGuid = this.getResponseProperty("UserGuid");
    this.userName = this.getResponseProperty("UserName");
    this.email = this.getResponseProperty("Email");
    this.useKeyConnector = this.getResponseProperty("UseKeyConnector");
    this.cipherIds = this.getResponseProperty("CipherIds");
  }
}
