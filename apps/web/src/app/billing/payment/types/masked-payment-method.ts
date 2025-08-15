import { BaseResponse } from "@bitwarden/common/models/response/base.response";

import {
  BankAccountPaymentMethod,
  CardPaymentMethod,
  PayPalPaymentMethod,
} from "./tokenized-payment-method";

export const StripeCardBrands = {
  amex: "amex",
  diners: "diners",
  discover: "discover",
  eftpos_au: "eftpos_au",
  jcb: "jcb",
  link: "link",
  mastercard: "mastercard",
  unionpay: "unionpay",
  visa: "visa",
  unknown: "unknown",
} as const;

export type StripeCardBrand = (typeof StripeCardBrands)[keyof typeof StripeCardBrands];

type MaskedBankAccount = {
  type: BankAccountPaymentMethod;
  bankName: string;
  last4: string;
  verified: boolean;
};

type MaskedCard = {
  type: CardPaymentMethod;
  brand: StripeCardBrand;
  last4: string;
  expiration: string;
};

type MaskedPayPalAccount = {
  type: PayPalPaymentMethod;
  email: string;
};

export type MaskedPaymentMethod = MaskedBankAccount | MaskedCard | MaskedPayPalAccount;

export class MaskedPaymentMethodResponse extends BaseResponse {
  value: MaskedPaymentMethod;

  constructor(response: any) {
    super(response);

    const type = this.getResponseProperty("Type");
    switch (type) {
      case "card": {
        this.value = new MaskedCardResponse(response);
        break;
      }
      case "bankAccount": {
        this.value = new MaskedBankAccountResponse(response);
        break;
      }
      case "payPal": {
        this.value = new MaskedPayPalAccountResponse(response);
        break;
      }
      default: {
        throw new Error(`Cannot deserialize unsupported payment method type: ${type}`);
      }
    }
  }
}

class MaskedBankAccountResponse extends BaseResponse implements MaskedBankAccount {
  type: BankAccountPaymentMethod;
  bankName: string;
  last4: string;
  verified: boolean;

  constructor(response: any) {
    super(response);

    this.type = "bankAccount";
    this.bankName = this.getResponseProperty("BankName");
    this.last4 = this.getResponseProperty("Last4");
    this.verified = this.getResponseProperty("Verified");
  }
}

class MaskedCardResponse extends BaseResponse implements MaskedCard {
  type: CardPaymentMethod;
  brand: StripeCardBrand;
  last4: string;
  expiration: string;

  constructor(response: any) {
    super(response);

    this.type = "card";
    this.brand = this.getResponseProperty("Brand");
    this.last4 = this.getResponseProperty("Last4");
    this.expiration = this.getResponseProperty("Expiration");
  }
}

class MaskedPayPalAccountResponse extends BaseResponse implements MaskedPayPalAccount {
  type: PayPalPaymentMethod;
  email: string;

  constructor(response: any) {
    super(response);

    this.type = "payPal";
    this.email = this.getResponseProperty("Email");
  }
}
