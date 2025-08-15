// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { ExpandedTaxInfoUpdateRequest } from "../../../../billing/models/request/expanded-tax-info-update.request";
import { TokenizedPaymentSourceRequest } from "../../../../billing/models/request/tokenized-payment-source.request";

export class ProviderSetupRequest {
  name: string;
  businessName: string;
  billingEmail: string;
  token: string;
  key: string;
  taxInfo: ExpandedTaxInfoUpdateRequest;
  paymentSource?: TokenizedPaymentSourceRequest;
}
