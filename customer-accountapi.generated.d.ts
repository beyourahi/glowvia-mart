/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as CustomerAccountAPI from "@shopify/hydrogen/customer-account-api-types";

export type CustomerAddressUpdateMutationVariables = CustomerAccountAPI.Exact<{
  address: CustomerAccountAPI.CustomerAddressInput;
  addressId: CustomerAccountAPI.Scalars["ID"]["input"];
  defaultAddress?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Boolean"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressUpdateMutation = {
  customerAddressUpdate?: CustomerAccountAPI.Maybe<{
    customerAddress?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.CustomerAddress, "id">
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type CustomerAddressDeleteMutationVariables = CustomerAccountAPI.Exact<{
  addressId: CustomerAccountAPI.Scalars["ID"]["input"];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressDeleteMutation = {
  customerAddressDelete?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddressDeletePayload,
      "deletedAddressId"
    > & {
      userErrors: Array<
        Pick<
          CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
          "code" | "field" | "message"
        >
      >;
    }
  >;
};

export type CustomerAddressCreateMutationVariables = CustomerAccountAPI.Exact<{
  address: CustomerAccountAPI.CustomerAddressInput;
  defaultAddress?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Boolean"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerAddressCreateMutation = {
  customerAddressCreate?: CustomerAccountAPI.Maybe<{
    customerAddress?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.CustomerAddress, "id">
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerAddressUserErrors,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type DashboardOrderFragment = Pick<
  CustomerAccountAPI.Order,
  "id" | "name" | "number" | "processedAt" | "financialStatus"
> & {
  fulfillments: {
    nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
  };
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  lineItems: {
    nodes: Array<
      Pick<CustomerAccountAPI.LineItem, "id" | "title"> & {
        image?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  };
};

export type CustomerDashboardQueryVariables = CustomerAccountAPI.Exact<{
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerDashboardQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          "id" | "name" | "number" | "processedAt" | "financialStatus"
        > & {
          fulfillments: {
            nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
          };
          totalPrice: Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          lineItems: {
            nodes: Array<
              Pick<CustomerAccountAPI.LineItem, "id" | "title"> & {
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "url" | "altText" | "width" | "height"
                  >
                >;
              }
            >;
          };
        }
      >;
      pageInfo: Pick<CustomerAccountAPI.PageInfo, "hasNextPage">;
    };
  };
};

export type CustomerFragment = Pick<
  CustomerAccountAPI.Customer,
  "id" | "firstName" | "lastName" | "displayName" | "imageUrl" | "creationDate"
> & {
  emailAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerEmailAddress,
      "emailAddress" | "marketingState"
    >
  >;
  phoneNumber?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerPhoneNumber,
      "phoneNumber" | "marketingState"
    >
  >;
  defaultAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddress,
      | "id"
      | "formatted"
      | "firstName"
      | "lastName"
      | "company"
      | "address1"
      | "address2"
      | "territoryCode"
      | "zoneCode"
      | "city"
      | "zip"
      | "phoneNumber"
    >
  >;
  addresses: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.CustomerAddress,
        | "id"
        | "formatted"
        | "firstName"
        | "lastName"
        | "company"
        | "address1"
        | "address2"
        | "territoryCode"
        | "zoneCode"
        | "city"
        | "zip"
        | "phoneNumber"
      >
    >;
  };
};

export type AddressFragment = Pick<
  CustomerAccountAPI.CustomerAddress,
  | "id"
  | "formatted"
  | "firstName"
  | "lastName"
  | "company"
  | "address1"
  | "address2"
  | "territoryCode"
  | "zoneCode"
  | "city"
  | "zip"
  | "phoneNumber"
>;

export type CustomerDetailsQueryVariables = CustomerAccountAPI.Exact<{
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerDetailsQuery = {
  customer: Pick<
    CustomerAccountAPI.Customer,
    | "id"
    | "firstName"
    | "lastName"
    | "displayName"
    | "imageUrl"
    | "creationDate"
  > & {
    emailAddress?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerEmailAddress,
        "emailAddress" | "marketingState"
      >
    >;
    phoneNumber?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerPhoneNumber,
        "phoneNumber" | "marketingState"
      >
    >;
    defaultAddress?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerAddress,
        | "id"
        | "formatted"
        | "firstName"
        | "lastName"
        | "company"
        | "address1"
        | "address2"
        | "territoryCode"
        | "zoneCode"
        | "city"
        | "zip"
        | "phoneNumber"
      >
    >;
    addresses: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.CustomerAddress,
          | "id"
          | "formatted"
          | "firstName"
          | "lastName"
          | "company"
          | "address1"
          | "address2"
          | "territoryCode"
          | "zoneCode"
          | "city"
          | "zip"
          | "phoneNumber"
        >
      >;
    };
  };
};

export type OrderHistoryLineItemFragment = Pick<
  CustomerAccountAPI.LineItem,
  "id" | "name" | "title" | "productId" | "variantId" | "quantity"
> & {
  price?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  image?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.Image, "url" | "altText" | "width" | "height">
  >;
};

export type OrderHistoryOrderFragment = Pick<
  CustomerAccountAPI.Order,
  | "id"
  | "name"
  | "number"
  | "processedAt"
  | "financialStatus"
  | "fulfillmentStatus"
> & {
  lineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.LineItem,
        "id" | "name" | "title" | "productId" | "variantId" | "quantity"
      > & {
        price?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  };
};

export type CustomerOrderHistoryQueryVariables = CustomerAccountAPI.Exact<{
  first: CustomerAccountAPI.Scalars["Int"]["input"];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerOrderHistoryQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          | "id"
          | "name"
          | "number"
          | "processedAt"
          | "financialStatus"
          | "fulfillmentStatus"
        > & {
          lineItems: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.LineItem,
                "id" | "name" | "title" | "productId" | "variantId" | "quantity"
              > & {
                price?: CustomerAccountAPI.Maybe<
                  Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
                >;
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "url" | "altText" | "width" | "height"
                  >
                >;
              }
            >;
          };
        }
      >;
    };
  };
};

export type OrderMoneyFragment = Pick<
  CustomerAccountAPI.MoneyV2,
  "amount" | "currencyCode"
>;

export type DiscountApplicationFragment = {
  value:
    | ({ __typename: "MoneyV2" } & Pick<
        CustomerAccountAPI.MoneyV2,
        "amount" | "currencyCode"
      >)
    | ({ __typename: "PricingPercentageValue" } & Pick<
        CustomerAccountAPI.PricingPercentageValue,
        "percentage"
      >);
};

export type OrderLineItemFullFragment = Pick<
  CustomerAccountAPI.LineItem,
  "id" | "title" | "quantity" | "variantTitle"
> & {
  price?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  discountAllocations: Array<{
    allocatedAmount: Pick<
      CustomerAccountAPI.MoneyV2,
      "amount" | "currencyCode"
    >;
    discountApplication: {
      value:
        | ({ __typename: "MoneyV2" } & Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >)
        | ({ __typename: "PricingPercentageValue" } & Pick<
            CustomerAccountAPI.PricingPercentageValue,
            "percentage"
          >);
    };
  }>;
  totalDiscount: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  image?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.Image,
      "altText" | "height" | "url" | "id" | "width"
    >
  >;
};

export type OrderFragment = Pick<
  CustomerAccountAPI.Order,
  | "id"
  | "name"
  | "confirmationNumber"
  | "statusPageUrl"
  | "fulfillmentStatus"
  | "processedAt"
> & {
  fulfillments: {
    nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
  };
  totalTax?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  subtotal?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  shippingAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddress,
      "name" | "formatted" | "formattedArea"
    >
  >;
  discountApplications: {
    nodes: Array<{
      value:
        | ({ __typename: "MoneyV2" } & Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >)
        | ({ __typename: "PricingPercentageValue" } & Pick<
            CustomerAccountAPI.PricingPercentageValue,
            "percentage"
          >);
    }>;
  };
  lineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.LineItem,
        "id" | "title" | "quantity" | "variantTitle"
      > & {
        price?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        discountAllocations: Array<{
          allocatedAmount: Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          discountApplication: {
            value:
              | ({ __typename: "MoneyV2" } & Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >)
              | ({ __typename: "PricingPercentageValue" } & Pick<
                  CustomerAccountAPI.PricingPercentageValue,
                  "percentage"
                >);
          };
        }>;
        totalDiscount: Pick<
          CustomerAccountAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<
            CustomerAccountAPI.Image,
            "altText" | "height" | "url" | "id" | "width"
          >
        >;
      }
    >;
  };
  returns: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Return,
        "id" | "name" | "status" | "createdAt"
      > & {
        returnLineItems: {
          nodes: Array<
            | (Pick<
                CustomerAccountAPI.ReturnLineItem,
                "id" | "quantity" | "returnReason"
              > & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  "id" | "title" | "variantTitle"
                > & {
                  image?: CustomerAccountAPI.Maybe<
                    Pick<
                      CustomerAccountAPI.Image,
                      "altText" | "url" | "width" | "height"
                    >
                  >;
                };
              })
            | (Pick<
                CustomerAccountAPI.UnverifiedReturnLineItem,
                "id" | "quantity" | "returnReason"
              > & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  "id" | "title" | "variantTitle"
                > & {
                  image?: CustomerAccountAPI.Maybe<
                    Pick<
                      CustomerAccountAPI.Image,
                      "altText" | "url" | "width" | "height"
                    >
                  >;
                };
              })
          >;
        };
      }
    >;
  };
  returnInformation: {
    returnableLineItems: {
      nodes: Array<
        Pick<CustomerAccountAPI.ReturnableLineItem, "quantity"> & {
          lineItem: Pick<
            CustomerAccountAPI.LineItem,
            "id" | "title" | "variantTitle"
          > & {
            image?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.Image,
                "altText" | "url" | "width" | "height"
              >
            >;
          };
        }
      >;
    };
    nonReturnableSummary?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.OrderNonReturnableSummary, "nonReturnableReasons">
    >;
  };
};

export type OrderQueryVariables = CustomerAccountAPI.Exact<{
  orderId: CustomerAccountAPI.Scalars["ID"]["input"];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type OrderQuery = {
  order?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.Order,
      | "id"
      | "name"
      | "confirmationNumber"
      | "statusPageUrl"
      | "fulfillmentStatus"
      | "processedAt"
    > & {
      fulfillments: {
        nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
      };
      totalTax?: CustomerAccountAPI.Maybe<
        Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
      >;
      totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
      subtotal?: CustomerAccountAPI.Maybe<
        Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
      >;
      shippingAddress?: CustomerAccountAPI.Maybe<
        Pick<
          CustomerAccountAPI.CustomerAddress,
          "name" | "formatted" | "formattedArea"
        >
      >;
      discountApplications: {
        nodes: Array<{
          value:
            | ({ __typename: "MoneyV2" } & Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >)
            | ({ __typename: "PricingPercentageValue" } & Pick<
                CustomerAccountAPI.PricingPercentageValue,
                "percentage"
              >);
        }>;
      };
      lineItems: {
        nodes: Array<
          Pick<
            CustomerAccountAPI.LineItem,
            "id" | "title" | "quantity" | "variantTitle"
          > & {
            price?: CustomerAccountAPI.Maybe<
              Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
            >;
            discountAllocations: Array<{
              allocatedAmount: Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
              discountApplication: {
                value:
                  | ({ __typename: "MoneyV2" } & Pick<
                      CustomerAccountAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >)
                  | ({ __typename: "PricingPercentageValue" } & Pick<
                      CustomerAccountAPI.PricingPercentageValue,
                      "percentage"
                    >);
              };
            }>;
            totalDiscount: Pick<
              CustomerAccountAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            image?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.Image,
                "altText" | "height" | "url" | "id" | "width"
              >
            >;
          }
        >;
      };
      returns: {
        nodes: Array<
          Pick<
            CustomerAccountAPI.Return,
            "id" | "name" | "status" | "createdAt"
          > & {
            returnLineItems: {
              nodes: Array<
                | (Pick<
                    CustomerAccountAPI.ReturnLineItem,
                    "id" | "quantity" | "returnReason"
                  > & {
                    lineItem: Pick<
                      CustomerAccountAPI.LineItem,
                      "id" | "title" | "variantTitle"
                    > & {
                      image?: CustomerAccountAPI.Maybe<
                        Pick<
                          CustomerAccountAPI.Image,
                          "altText" | "url" | "width" | "height"
                        >
                      >;
                    };
                  })
                | (Pick<
                    CustomerAccountAPI.UnverifiedReturnLineItem,
                    "id" | "quantity" | "returnReason"
                  > & {
                    lineItem: Pick<
                      CustomerAccountAPI.LineItem,
                      "id" | "title" | "variantTitle"
                    > & {
                      image?: CustomerAccountAPI.Maybe<
                        Pick<
                          CustomerAccountAPI.Image,
                          "altText" | "url" | "width" | "height"
                        >
                      >;
                    };
                  })
              >;
            };
          }
        >;
      };
      returnInformation: {
        returnableLineItems: {
          nodes: Array<
            Pick<CustomerAccountAPI.ReturnableLineItem, "quantity"> & {
              lineItem: Pick<
                CustomerAccountAPI.LineItem,
                "id" | "title" | "variantTitle"
              > & {
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "altText" | "url" | "width" | "height"
                  >
                >;
              };
            }
          >;
        };
        nonReturnableSummary?: CustomerAccountAPI.Maybe<
          Pick<
            CustomerAccountAPI.OrderNonReturnableSummary,
            "nonReturnableReasons"
          >
        >;
      };
    }
  >;
};

export type OrderListItemFragment = Pick<
  CustomerAccountAPI.Order,
  "id" | "name" | "number" | "processedAt" | "fulfillmentStatus"
> & {
  fulfillments: {
    nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
  };
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  lineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.LineItem,
        | "id"
        | "title"
        | "name"
        | "quantity"
        | "productId"
        | "variantId"
        | "variantTitle"
      > & {
        price?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  };
};

export type CustomerOrdersListFragment = {
  orders: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Order,
        "id" | "name" | "number" | "processedAt" | "fulfillmentStatus"
      > & {
        fulfillments: {
          nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
        };
        totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
        lineItems: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.LineItem,
              | "id"
              | "title"
              | "name"
              | "quantity"
              | "productId"
              | "variantId"
              | "variantTitle"
            > & {
              price?: CustomerAccountAPI.Maybe<
                Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
              >;
              image?: CustomerAccountAPI.Maybe<
                Pick<
                  CustomerAccountAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      CustomerAccountAPI.PageInfo,
      "hasPreviousPage" | "hasNextPage" | "endCursor" | "startCursor"
    >;
  };
};

export type OrderItemFragment = Pick<
  CustomerAccountAPI.Order,
  | "id"
  | "name"
  | "number"
  | "confirmationNumber"
  | "statusPageUrl"
  | "processedAt"
  | "financialStatus"
  | "fulfillmentStatus"
> & {
  fulfillments: {
    nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
  };
  subtotal?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  totalTax?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
  >;
  totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  discountApplications: {
    nodes: Array<{
      value:
        | ({ __typename: "MoneyV2" } & Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >)
        | ({ __typename: "PricingPercentageValue" } & Pick<
            CustomerAccountAPI.PricingPercentageValue,
            "percentage"
          >);
    }>;
  };
  lineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.LineItem,
        "id" | "title" | "quantity" | "variantTitle"
      > & {
        price?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        discountAllocations: Array<{
          allocatedAmount: Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          discountApplication: {
            value:
              | ({ __typename: "MoneyV2" } & Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >)
              | ({ __typename: "PricingPercentageValue" } & Pick<
                  CustomerAccountAPI.PricingPercentageValue,
                  "percentage"
                >);
          };
        }>;
        totalDiscount: Pick<
          CustomerAccountAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<
            CustomerAccountAPI.Image,
            "altText" | "height" | "url" | "id" | "width"
          >
        >;
      }
    >;
  };
  shippingAddress?: CustomerAccountAPI.Maybe<
    Pick<
      CustomerAccountAPI.CustomerAddress,
      "name" | "formatted" | "formattedArea"
    >
  >;
};

export type CustomerOrdersFragment = {
  orders: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Order,
        | "id"
        | "name"
        | "number"
        | "confirmationNumber"
        | "statusPageUrl"
        | "processedAt"
        | "financialStatus"
        | "fulfillmentStatus"
      > & {
        fulfillments: {
          nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
        };
        subtotal?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        totalTax?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
        >;
        totalPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
        discountApplications: {
          nodes: Array<{
            value:
              | ({ __typename: "MoneyV2" } & Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >)
              | ({ __typename: "PricingPercentageValue" } & Pick<
                  CustomerAccountAPI.PricingPercentageValue,
                  "percentage"
                >);
          }>;
        };
        lineItems: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.LineItem,
              "id" | "title" | "quantity" | "variantTitle"
            > & {
              price?: CustomerAccountAPI.Maybe<
                Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
              >;
              discountAllocations: Array<{
                allocatedAmount: Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                discountApplication: {
                  value:
                    | ({ __typename: "MoneyV2" } & Pick<
                        CustomerAccountAPI.MoneyV2,
                        "amount" | "currencyCode"
                      >)
                    | ({ __typename: "PricingPercentageValue" } & Pick<
                        CustomerAccountAPI.PricingPercentageValue,
                        "percentage"
                      >);
                };
              }>;
              totalDiscount: Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
              image?: CustomerAccountAPI.Maybe<
                Pick<
                  CustomerAccountAPI.Image,
                  "altText" | "height" | "url" | "id" | "width"
                >
              >;
            }
          >;
        };
        shippingAddress?: CustomerAccountAPI.Maybe<
          Pick<
            CustomerAccountAPI.CustomerAddress,
            "name" | "formatted" | "formattedArea"
          >
        >;
      }
    >;
    pageInfo: Pick<
      CustomerAccountAPI.PageInfo,
      "hasPreviousPage" | "hasNextPage" | "endCursor" | "startCursor"
    >;
  };
};

export type CustomerOrdersQueryVariables = CustomerAccountAPI.Exact<{
  endCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  last?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  startCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  query?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerOrdersQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          | "id"
          | "name"
          | "number"
          | "confirmationNumber"
          | "statusPageUrl"
          | "processedAt"
          | "financialStatus"
          | "fulfillmentStatus"
        > & {
          fulfillments: {
            nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
          };
          subtotal?: CustomerAccountAPI.Maybe<
            Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
          >;
          totalTax?: CustomerAccountAPI.Maybe<
            Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
          >;
          totalPrice: Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          discountApplications: {
            nodes: Array<{
              value:
                | ({ __typename: "MoneyV2" } & Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >)
                | ({ __typename: "PricingPercentageValue" } & Pick<
                    CustomerAccountAPI.PricingPercentageValue,
                    "percentage"
                  >);
            }>;
          };
          lineItems: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.LineItem,
                "id" | "title" | "quantity" | "variantTitle"
              > & {
                price?: CustomerAccountAPI.Maybe<
                  Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
                >;
                discountAllocations: Array<{
                  allocatedAmount: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                  discountApplication: {
                    value:
                      | ({ __typename: "MoneyV2" } & Pick<
                          CustomerAccountAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >)
                      | ({ __typename: "PricingPercentageValue" } & Pick<
                          CustomerAccountAPI.PricingPercentageValue,
                          "percentage"
                        >);
                  };
                }>;
                totalDiscount: Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "altText" | "height" | "url" | "id" | "width"
                  >
                >;
              }
            >;
          };
          shippingAddress?: CustomerAccountAPI.Maybe<
            Pick<
              CustomerAccountAPI.CustomerAddress,
              "name" | "formatted" | "formattedArea"
            >
          >;
        }
      >;
      pageInfo: Pick<
        CustomerAccountAPI.PageInfo,
        "hasPreviousPage" | "hasNextPage" | "endCursor" | "startCursor"
      >;
    };
  };
};

export type CustomerOrdersListQueryVariables = CustomerAccountAPI.Exact<{
  endCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  last?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  startCursor?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerOrdersListQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          "id" | "name" | "number" | "processedAt" | "fulfillmentStatus"
        > & {
          fulfillments: {
            nodes: Array<Pick<CustomerAccountAPI.Fulfillment, "status">>;
          };
          totalPrice: Pick<
            CustomerAccountAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          lineItems: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.LineItem,
                | "id"
                | "title"
                | "name"
                | "quantity"
                | "productId"
                | "variantId"
                | "variantTitle"
              > & {
                price?: CustomerAccountAPI.Maybe<
                  Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">
                >;
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "url" | "altText" | "width" | "height"
                  >
                >;
              }
            >;
          };
        }
      >;
      pageInfo: Pick<
        CustomerAccountAPI.PageInfo,
        "hasPreviousPage" | "hasNextPage" | "endCursor" | "startCursor"
      >;
    };
  };
};

export type ReturnLineItemFragment = Pick<
  CustomerAccountAPI.ReturnLineItem,
  "id" | "quantity" | "returnReason"
> & {
  lineItem: Pick<
    CustomerAccountAPI.LineItem,
    "id" | "title" | "variantTitle"
  > & {
    image?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Image, "altText" | "url" | "width" | "height">
    >;
  };
};

export type ReturnInfoFragment = Pick<
  CustomerAccountAPI.Return,
  "id" | "name" | "status" | "createdAt"
> & {
  returnLineItems: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.ReturnLineItem,
        "id" | "quantity" | "returnReason"
      > & {
        lineItem: Pick<
          CustomerAccountAPI.LineItem,
          "id" | "title" | "variantTitle"
        > & {
          image?: CustomerAccountAPI.Maybe<
            Pick<
              CustomerAccountAPI.Image,
              "altText" | "url" | "width" | "height"
            >
          >;
        };
      }
    >;
  };
};

export type OrderWithReturnsFragment = Pick<
  CustomerAccountAPI.Order,
  "id" | "name" | "number" | "processedAt"
> & {
  returns: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.Return,
        "id" | "name" | "status" | "createdAt"
      > & {
        returnLineItems: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.ReturnLineItem,
              "id" | "quantity" | "returnReason"
            > & {
              lineItem: Pick<
                CustomerAccountAPI.LineItem,
                "id" | "title" | "variantTitle"
              > & {
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "altText" | "url" | "width" | "height"
                  >
                >;
              };
            }
          >;
        };
      }
    >;
  };
};

export type CustomerReturnsQueryVariables = CustomerAccountAPI.Exact<{
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  after?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerReturnsQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<
          CustomerAccountAPI.Order,
          "id" | "name" | "number" | "processedAt"
        > & {
          returns: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.Return,
                "id" | "name" | "status" | "createdAt"
              > & {
                returnLineItems: {
                  nodes: Array<
                    Pick<
                      CustomerAccountAPI.ReturnLineItem,
                      "id" | "quantity" | "returnReason"
                    > & {
                      lineItem: Pick<
                        CustomerAccountAPI.LineItem,
                        "id" | "title" | "variantTitle"
                      > & {
                        image?: CustomerAccountAPI.Maybe<
                          Pick<
                            CustomerAccountAPI.Image,
                            "altText" | "url" | "width" | "height"
                          >
                        >;
                      };
                    }
                  >;
                };
              }
            >;
          };
        }
      >;
      pageInfo: Pick<CustomerAccountAPI.PageInfo, "hasNextPage" | "endCursor">;
    };
  };
};

export type CustomerUpdateMutationVariables = CustomerAccountAPI.Exact<{
  customer: CustomerAccountAPI.CustomerUpdateInput;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerUpdateMutation = {
  customerUpdate?: CustomerAccountAPI.Maybe<{
    customer?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Customer, "firstName" | "lastName"> & {
        emailAddress?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.CustomerEmailAddress, "emailAddress">
        >;
        phoneNumber?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.CustomerPhoneNumber, "phoneNumber">
        >;
      }
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerUserErrors,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type CustomerEmailMarketingSubscribeMutationVariables =
  CustomerAccountAPI.Exact<{
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type CustomerEmailMarketingSubscribeMutation = {
  customerEmailMarketingSubscribe?: CustomerAccountAPI.Maybe<{
    emailAddress?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerEmailAddress,
        "emailAddress" | "marketingState"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerEmailMarketingUserErrors,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type CustomerEmailMarketingUnsubscribeMutationVariables =
  CustomerAccountAPI.Exact<{
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type CustomerEmailMarketingUnsubscribeMutation = {
  customerEmailMarketingUnsubscribe?: CustomerAccountAPI.Maybe<{
    emailAddress?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.CustomerEmailAddress,
        "emailAddress" | "marketingState"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.UserErrorsCustomerEmailMarketingUserErrors,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type OrderRequestReturnMutationVariables = CustomerAccountAPI.Exact<{
  orderId: CustomerAccountAPI.Scalars["ID"]["input"];
  requestedLineItems:
    | Array<CustomerAccountAPI.RequestedLineItemInput>
    | CustomerAccountAPI.RequestedLineItemInput;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type OrderRequestReturnMutation = {
  orderRequestReturn?: CustomerAccountAPI.Maybe<{
    return?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.Return,
        "id" | "name" | "status" | "createdAt"
      > & {
        returnLineItems: {
          nodes: Array<
            | (Pick<
                CustomerAccountAPI.ReturnLineItem,
                "id" | "quantity" | "returnReason"
              > & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  "id" | "title" | "variantTitle"
                >;
              })
            | (Pick<
                CustomerAccountAPI.UnverifiedReturnLineItem,
                "id" | "quantity" | "returnReason"
              > & {
                lineItem: Pick<
                  CustomerAccountAPI.LineItem,
                  "id" | "title" | "variantTitle"
                >;
              })
          >;
        };
      }
    >;
    userErrors: Array<
      Pick<CustomerAccountAPI.ReturnUserError, "code" | "field" | "message">
    >;
  }>;
};

export type ReturnsAvailabilityQueryVariables = CustomerAccountAPI.Exact<{
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type ReturnsAvailabilityQuery = {
  customer: {
    orders: {
      nodes: Array<
        Pick<CustomerAccountAPI.Order, "id" | "fulfillmentStatus"> & {
          returnInformation: {
            returnableLineItems: {
              nodes: Array<
                Pick<CustomerAccountAPI.ReturnableLineItem, "quantity">
              >;
            };
            nonReturnableSummary?: CustomerAccountAPI.Maybe<
              Pick<
                CustomerAccountAPI.OrderNonReturnableSummary,
                "nonReturnableReasons"
              >
            >;
          };
        }
      >;
    };
  };
};

export type StoreCreditAccountFragment = Pick<
  CustomerAccountAPI.StoreCreditAccount,
  "id"
> & { balance: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode"> };

type StoreCreditTransaction_StoreCreditAccountCreditTransaction_Fragment = Pick<
  CustomerAccountAPI.StoreCreditAccountCreditTransaction,
  "id" | "createdAt" | "expiresAt"
> & {
  amount: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  balanceAfterTransaction: Pick<
    CustomerAccountAPI.MoneyV2,
    "amount" | "currencyCode"
  >;
  remainingAmount: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
};

type StoreCreditTransaction_StoreCreditAccountDebitRevertTransaction_StoreCreditAccountExpirationTransaction_Fragment =
  {};

type StoreCreditTransaction_StoreCreditAccountDebitTransaction_Fragment = Pick<
  CustomerAccountAPI.StoreCreditAccountDebitTransaction,
  "id" | "createdAt"
> & {
  amount: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  balanceAfterTransaction: Pick<
    CustomerAccountAPI.MoneyV2,
    "amount" | "currencyCode"
  >;
};

export type StoreCreditTransactionFragment =
  | StoreCreditTransaction_StoreCreditAccountCreditTransaction_Fragment
  | StoreCreditTransaction_StoreCreditAccountDebitRevertTransaction_StoreCreditAccountExpirationTransaction_Fragment
  | StoreCreditTransaction_StoreCreditAccountDebitTransaction_Fragment;

export type CustomerStoreCreditQueryVariables = CustomerAccountAPI.Exact<{
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  transactionsFirst?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerStoreCreditQuery = {
  customer: {
    storeCreditAccounts: {
      nodes: Array<
        Pick<CustomerAccountAPI.StoreCreditAccount, "id"> & {
          transactions: {
            nodes: Array<
              | (Pick<
                  CustomerAccountAPI.StoreCreditAccountCreditTransaction,
                  "id" | "createdAt" | "expiresAt"
                > & {
                  amount: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                  balanceAfterTransaction: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                  remainingAmount: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                })
              | (Pick<
                  CustomerAccountAPI.StoreCreditAccountDebitTransaction,
                  "id" | "createdAt"
                > & {
                  amount: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                  balanceAfterTransaction: Pick<
                    CustomerAccountAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                })
            >;
            pageInfo: Pick<
              CustomerAccountAPI.PageInfo,
              "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
            >;
          };
          balance: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
        }
      >;
    };
  };
};

export type CustomerStoreCreditBalanceQueryVariables =
  CustomerAccountAPI.Exact<{
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type CustomerStoreCreditBalanceQuery = {
  customer: {
    storeCreditAccounts: {
      nodes: Array<
        Pick<CustomerAccountAPI.StoreCreditAccount, "id"> & {
          balance: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
        }
      >;
    };
  };
};

export type SubscriptionContractPauseMutationVariables =
  CustomerAccountAPI.Exact<{
    subscriptionContractId: CustomerAccountAPI.Scalars["ID"]["input"];
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type SubscriptionContractPauseMutation = {
  subscriptionContractPause?: CustomerAccountAPI.Maybe<{
    contract?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionContract,
        "id" | "status" | "updatedAt"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.SubscriptionContractStatusUpdateUserError,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type SubscriptionContractCancelMutationVariables =
  CustomerAccountAPI.Exact<{
    subscriptionContractId: CustomerAccountAPI.Scalars["ID"]["input"];
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type SubscriptionContractCancelMutation = {
  subscriptionContractCancel?: CustomerAccountAPI.Maybe<{
    contract?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionContract,
        "id" | "status" | "updatedAt"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.SubscriptionContractStatusUpdateUserError,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type SubscriptionContractActivateMutationVariables =
  CustomerAccountAPI.Exact<{
    subscriptionContractId: CustomerAccountAPI.Scalars["ID"]["input"];
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type SubscriptionContractActivateMutation = {
  subscriptionContractActivate?: CustomerAccountAPI.Maybe<{
    contract?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionContract,
        "id" | "status" | "updatedAt" | "nextBillingDate"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.SubscriptionContractStatusUpdateUserError,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type SubscriptionBillingCycleSkipMutationVariables =
  CustomerAccountAPI.Exact<{
    billingCycleInput: CustomerAccountAPI.SubscriptionBillingCycleInput;
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type SubscriptionBillingCycleSkipMutation = {
  subscriptionBillingCycleSkip?: CustomerAccountAPI.Maybe<{
    billingCycle?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionBillingCycle,
        "cycleIndex" | "skipped" | "billingAttemptExpectedDate" | "status"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.SubscriptionBillingCycleSkipUserError,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type SubscriptionBillingCycleUnskipMutationVariables =
  CustomerAccountAPI.Exact<{
    billingCycleInput: CustomerAccountAPI.SubscriptionBillingCycleInput;
    language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
  }>;

export type SubscriptionBillingCycleUnskipMutation = {
  subscriptionBillingCycleUnskip?: CustomerAccountAPI.Maybe<{
    billingCycle?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionBillingCycle,
        "cycleIndex" | "skipped" | "billingAttemptExpectedDate" | "status"
      >
    >;
    userErrors: Array<
      Pick<
        CustomerAccountAPI.SubscriptionBillingCycleUnskipUserError,
        "code" | "field" | "message"
      >
    >;
  }>;
};

export type SubscriptionLineFragment = Pick<
  CustomerAccountAPI.SubscriptionLine,
  "id" | "name" | "title" | "variantTitle" | "quantity" | "sku"
> & {
  currentPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  lineDiscountedPrice: Pick<
    CustomerAccountAPI.MoneyV2,
    "amount" | "currencyCode"
  >;
  image?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.Image, "altText" | "url" | "width" | "height">
  >;
};

export type SubscriptionBillingPolicyFragment = Pick<
  CustomerAccountAPI.SubscriptionBillingPolicy,
  "interval" | "minCycles" | "maxCycles"
> & {
  intervalCount?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.Count, "count">
  >;
};

export type SubscriptionDeliveryPolicyFragment = Pick<
  CustomerAccountAPI.SubscriptionDeliveryPolicy,
  "interval"
> & {
  intervalCount?: CustomerAccountAPI.Maybe<
    Pick<CustomerAccountAPI.Count, "count">
  >;
};

export type SubscriptionBillingCycleFragment = Pick<
  CustomerAccountAPI.SubscriptionBillingCycle,
  | "cycleIndex"
  | "cycleStartAt"
  | "cycleEndAt"
  | "billingAttemptExpectedDate"
  | "skipped"
  | "status"
>;

export type SubscriptionContractFragment = Pick<
  CustomerAccountAPI.SubscriptionContract,
  | "id"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "nextBillingDate"
  | "currencyCode"
  | "note"
  | "lastPaymentStatus"
  | "lastBillingAttemptErrorType"
> & {
  deliveryPrice: Pick<CustomerAccountAPI.MoneyV2, "amount" | "currencyCode">;
  billingPolicy: Pick<
    CustomerAccountAPI.SubscriptionBillingPolicy,
    "interval" | "minCycles" | "maxCycles"
  > & {
    intervalCount?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Count, "count">
    >;
  };
  deliveryPolicy: Pick<
    CustomerAccountAPI.SubscriptionDeliveryPolicy,
    "interval"
  > & {
    intervalCount?: CustomerAccountAPI.Maybe<
      Pick<CustomerAccountAPI.Count, "count">
    >;
  };
  lines: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.SubscriptionLine,
        "id" | "name" | "title" | "variantTitle" | "quantity" | "sku"
      > & {
        currentPrice: Pick<
          CustomerAccountAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
        lineDiscountedPrice: Pick<
          CustomerAccountAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
        image?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.Image, "altText" | "url" | "width" | "height">
        >;
      }
    >;
  };
  upcomingBillingCycles: {
    nodes: Array<
      Pick<
        CustomerAccountAPI.SubscriptionBillingCycle,
        | "cycleIndex"
        | "cycleStartAt"
        | "cycleEndAt"
        | "billingAttemptExpectedDate"
        | "skipped"
        | "status"
      >
    >;
  };
};

export type CustomerSubscriptionsQueryVariables = CustomerAccountAPI.Exact<{
  first?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  after?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  last?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Int"]["input"]
  >;
  before?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["String"]["input"]
  >;
  reverse?: CustomerAccountAPI.InputMaybe<
    CustomerAccountAPI.Scalars["Boolean"]["input"]
  >;
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerSubscriptionsQuery = {
  customer: {
    subscriptionContracts: {
      pageInfo: Pick<
        CustomerAccountAPI.PageInfo,
        "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
      >;
      nodes: Array<
        Pick<
          CustomerAccountAPI.SubscriptionContract,
          "id" | "status" | "createdAt" | "nextBillingDate" | "currencyCode"
        > & {
          billingPolicy: Pick<
            CustomerAccountAPI.SubscriptionBillingPolicy,
            "interval"
          > & {
            intervalCount?: CustomerAccountAPI.Maybe<
              Pick<CustomerAccountAPI.Count, "count">
            >;
          };
          lines: {
            nodes: Array<
              Pick<
                CustomerAccountAPI.SubscriptionLine,
                "id" | "name" | "title" | "quantity"
              > & {
                currentPrice: Pick<
                  CustomerAccountAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                image?: CustomerAccountAPI.Maybe<
                  Pick<
                    CustomerAccountAPI.Image,
                    "altText" | "url" | "width" | "height"
                  >
                >;
              }
            >;
          };
        }
      >;
    };
  };
};

export type CustomerSubscriptionQueryVariables = CustomerAccountAPI.Exact<{
  id: CustomerAccountAPI.Scalars["ID"]["input"];
  language?: CustomerAccountAPI.InputMaybe<CustomerAccountAPI.LanguageCode>;
}>;

export type CustomerSubscriptionQuery = {
  customer: {
    subscriptionContract?: CustomerAccountAPI.Maybe<
      Pick<
        CustomerAccountAPI.SubscriptionContract,
        | "id"
        | "status"
        | "createdAt"
        | "updatedAt"
        | "nextBillingDate"
        | "currencyCode"
        | "note"
        | "lastPaymentStatus"
        | "lastBillingAttemptErrorType"
      > & {
        orders: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.Order,
              "id" | "name" | "processedAt" | "fulfillmentStatus"
            > & {
              totalPrice: Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
            }
          >;
        };
        originOrder?: CustomerAccountAPI.Maybe<
          Pick<CustomerAccountAPI.Order, "id" | "name" | "processedAt">
        >;
        deliveryPrice: Pick<
          CustomerAccountAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
        billingPolicy: Pick<
          CustomerAccountAPI.SubscriptionBillingPolicy,
          "interval" | "minCycles" | "maxCycles"
        > & {
          intervalCount?: CustomerAccountAPI.Maybe<
            Pick<CustomerAccountAPI.Count, "count">
          >;
        };
        deliveryPolicy: Pick<
          CustomerAccountAPI.SubscriptionDeliveryPolicy,
          "interval"
        > & {
          intervalCount?: CustomerAccountAPI.Maybe<
            Pick<CustomerAccountAPI.Count, "count">
          >;
        };
        lines: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.SubscriptionLine,
              "id" | "name" | "title" | "variantTitle" | "quantity" | "sku"
            > & {
              currentPrice: Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
              lineDiscountedPrice: Pick<
                CustomerAccountAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
              image?: CustomerAccountAPI.Maybe<
                Pick<
                  CustomerAccountAPI.Image,
                  "altText" | "url" | "width" | "height"
                >
              >;
            }
          >;
        };
        upcomingBillingCycles: {
          nodes: Array<
            Pick<
              CustomerAccountAPI.SubscriptionBillingCycle,
              | "cycleIndex"
              | "cycleStartAt"
              | "cycleEndAt"
              | "billingAttemptExpectedDate"
              | "skipped"
              | "status"
            >
          >;
        };
      }
    >;
  };
};

interface GeneratedQueryTypes {
  "#graphql\n  #graphql\n  fragment DashboardOrder on Order {\n    id\n    name\n    number\n    processedAt\n    financialStatus\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n    totalPrice {\n      amount\n      currencyCode\n    }\n    lineItems(first: 4) {\n      nodes {\n        id\n        title\n        image {\n          url\n          altText\n          width\n          height\n        }\n      }\n    }\n  }\n\n  query CustomerDashboard($language: LanguageCode) @inContext(language: $language) {\n    customer {\n      orders(first: 3, sortKey: PROCESSED_AT, reverse: true) {\n        nodes {\n          ...DashboardOrder\n        }\n        pageInfo {\n          hasNextPage\n        }\n      }\n    }\n  }\n": {
    return: CustomerDashboardQuery;
    variables: CustomerDashboardQueryVariables;
  };
  "#graphql\n  query CustomerDetails($language: LanguageCode) @inContext(language: $language) {\n    customer {\n      ...Customer\n    }\n  }\n  #graphql\n  fragment Customer on Customer {\n    id\n    firstName\n    lastName\n    displayName\n    imageUrl\n    creationDate\n    emailAddress {\n      emailAddress\n      marketingState\n    }\n    phoneNumber {\n      phoneNumber\n      marketingState\n    }\n    defaultAddress {\n      ...Address\n    }\n    addresses(first: 6) {\n      nodes {\n        ...Address\n      }\n    }\n  }\n  fragment Address on CustomerAddress {\n    id\n    formatted\n    firstName\n    lastName\n    company\n    address1\n    address2\n    territoryCode\n    zoneCode\n    city\n    zip\n    phoneNumber\n  }\n\n": {
    return: CustomerDetailsQuery;
    variables: CustomerDetailsQueryVariables;
  };
  "#graphql\n  #graphql\n  fragment OrderHistoryOrder on Order {\n    id\n    name\n    number\n    processedAt\n    financialStatus\n    fulfillmentStatus\n    lineItems(first: 10) {\n      nodes {\n        ...OrderHistoryLineItem\n      }\n    }\n  }\n  #graphql\n  fragment OrderHistoryLineItem on LineItem {\n    id\n    name\n    title\n    productId\n    variantId\n    quantity\n    price {\n      amount\n      currencyCode\n    }\n    image {\n      url\n      altText\n      width\n      height\n    }\n  }\n\n\n  query CustomerOrderHistory(\n    $first: Int!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {\n        nodes {\n          ...OrderHistoryOrder\n        }\n      }\n    }\n  }\n": {
    return: CustomerOrderHistoryQuery;
    variables: CustomerOrderHistoryQueryVariables;
  };
  "#graphql\n  fragment OrderMoney on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment DiscountApplication on DiscountApplication {\n    value {\n      __typename\n      ... on MoneyV2 {\n        ...OrderMoney\n      }\n      ... on PricingPercentageValue {\n        percentage\n      }\n    }\n  }\n  fragment OrderLineItemFull on LineItem {\n    id\n    title\n    quantity\n    price {\n      ...OrderMoney\n    }\n    discountAllocations {\n      allocatedAmount {\n        ...OrderMoney\n      }\n      discountApplication {\n        ...DiscountApplication\n      }\n    }\n    totalDiscount {\n      ...OrderMoney\n    }\n    image {\n      altText\n      height\n      url\n      id\n      width\n    }\n    variantTitle\n  }\n  fragment Order on Order {\n    id\n    name\n    confirmationNumber\n    statusPageUrl\n    fulfillmentStatus\n    processedAt\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n    totalTax {\n      ...OrderMoney\n    }\n    totalPrice {\n      ...OrderMoney\n    }\n    subtotal {\n      ...OrderMoney\n    }\n    shippingAddress {\n      name\n      formatted(withName: true)\n      formattedArea\n    }\n    discountApplications(first: 100) {\n      nodes {\n        ...DiscountApplication\n      }\n    }\n    lineItems(first: 100) {\n      nodes {\n        ...OrderLineItemFull\n      }\n    }\n    returns(first: 10) {\n      nodes {\n        id\n        name\n        status\n        createdAt\n        returnLineItems(first: 20) {\n          nodes {\n            id\n            quantity\n            returnReason\n            lineItem {\n              id\n              title\n              variantTitle\n              image {\n                altText\n                url\n                width\n                height\n              }\n            }\n          }\n        }\n      }\n    }\n    returnInformation {\n      returnableLineItems(first: 100) {\n        nodes {\n          quantity\n          lineItem {\n            id\n            title\n            variantTitle\n            image {\n              altText\n              url\n              width\n              height\n            }\n          }\n        }\n      }\n      nonReturnableSummary {\n        nonReturnableReasons\n      }\n    }\n  }\n  query Order($orderId: ID!, $language: LanguageCode)\n    @inContext(language: $language) {\n    order(id: $orderId) {\n      ... on Order {\n        ...Order\n      }\n    }\n  }\n": {
    return: OrderQuery;
    variables: OrderQueryVariables;
  };
  "#graphql\n  #graphql\n  fragment CustomerOrders on Customer {\n    orders(\n      sortKey: PROCESSED_AT,\n      reverse: true,\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor,\n      query: $query\n    ) {\n      nodes {\n        ...OrderItem\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        endCursor\n        startCursor\n      }\n    }\n  }\n  #graphql\n  fragment OrderItem on Order {\n    id\n    name\n    number\n    confirmationNumber\n    statusPageUrl\n    processedAt\n    financialStatus\n    fulfillmentStatus\n\n    # Fulfillment details from first fulfillment\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n\n    # Pricing\n    subtotal {\n      amount\n      currencyCode\n    }\n    totalTax {\n      amount\n      currencyCode\n    }\n    totalPrice {\n      amount\n      currencyCode\n    }\n\n    # Order-level discounts\n    discountApplications(first: 10) {\n      nodes {\n        value {\n          __typename\n          ... on MoneyV2 {\n            amount\n            currencyCode\n          }\n          ... on PricingPercentageValue {\n            percentage\n          }\n        }\n      }\n    }\n\n    # Line items with full details\n    lineItems(first: 50) {\n      nodes {\n        id\n        title\n        quantity\n        price {\n          amount\n          currencyCode\n        }\n        discountAllocations {\n          allocatedAmount {\n            amount\n            currencyCode\n          }\n          discountApplication {\n            value {\n              __typename\n              ... on MoneyV2 {\n                amount\n                currencyCode\n              }\n              ... on PricingPercentageValue {\n                percentage\n              }\n            }\n          }\n        }\n        totalDiscount {\n          amount\n          currencyCode\n        }\n        image {\n          altText\n          height\n          url\n          id\n          width\n        }\n        variantTitle\n      }\n    }\n\n    # Shipping address\n    shippingAddress {\n      name\n      formatted(withName: true)\n      formattedArea\n    }\n  }\n\n\n  query CustomerOrders(\n    $endCursor: String\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $query: String\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      ...CustomerOrders\n    }\n  }\n": {
    return: CustomerOrdersQuery;
    variables: CustomerOrdersQueryVariables;
  };
  "#graphql\n  #graphql\n  fragment CustomerOrdersList on Customer {\n    orders(\n      sortKey: PROCESSED_AT,\n      reverse: true,\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor\n    ) {\n      nodes {\n        ...OrderListItem\n      }\n      pageInfo {\n        hasPreviousPage\n        hasNextPage\n        endCursor\n        startCursor\n      }\n    }\n  }\n  #graphql\n  fragment OrderListItem on Order {\n    id\n    name\n    number\n    processedAt\n    fulfillmentStatus\n    fulfillments(first: 1) {\n      nodes {\n        status\n      }\n    }\n    totalPrice {\n      amount\n      currencyCode\n    }\n    lineItems(first: 20) {\n      nodes {\n        id\n        title\n        name\n        quantity\n        productId\n        variantId\n        price {\n          amount\n          currencyCode\n        }\n        image {\n          url\n          altText\n          width\n          height\n        }\n        variantTitle\n      }\n    }\n  }\n\n\n  query CustomerOrdersList(\n    $endCursor: String\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      ...CustomerOrdersList\n    }\n  }\n": {
    return: CustomerOrdersListQuery;
    variables: CustomerOrdersListQueryVariables;
  };
  "#graphql\n  fragment ReturnLineItem on ReturnLineItem {\n    id\n    quantity\n    returnReason\n    lineItem {\n      id\n      title\n      variantTitle\n      image {\n        altText\n        url\n        width\n        height\n      }\n    }\n  }\n  fragment ReturnInfo on Return {\n    id\n    name\n    status\n    createdAt\n    returnLineItems(first: 20) {\n      nodes {\n        ...ReturnLineItem\n      }\n    }\n  }\n  fragment OrderWithReturns on Order {\n    id\n    name\n    number\n    processedAt\n    returns(first: 10) {\n      nodes {\n        ...ReturnInfo\n      }\n    }\n  }\n  query CustomerReturns(\n    $first: Int\n    $after: String\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      orders(\n        sortKey: PROCESSED_AT\n        reverse: true\n        first: $first\n        after: $after\n      ) {\n        nodes {\n          ...OrderWithReturns\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n": {
    return: CustomerReturnsQuery;
    variables: CustomerReturnsQueryVariables;
  };
  "#graphql\n  query ReturnsAvailability(\n    $first: Int\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {\n        nodes {\n          id\n          fulfillmentStatus\n          returnInformation {\n            returnableLineItems(first: 1) {\n              nodes {\n                quantity\n              }\n            }\n            nonReturnableSummary {\n              nonReturnableReasons\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: ReturnsAvailabilityQuery;
    variables: ReturnsAvailabilityQueryVariables;
  };
  "#graphql\n  query CustomerStoreCredit(\n    $first: Int = 10\n    $transactionsFirst: Int = 20\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      storeCreditAccounts(first: $first) {\n        nodes {\n          ...StoreCreditAccount\n          transactions(first: $transactionsFirst, reverse: true) {\n            nodes {\n              ...StoreCreditTransaction\n            }\n            pageInfo {\n              hasNextPage\n              hasPreviousPage\n              startCursor\n              endCursor\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment StoreCreditAccount on StoreCreditAccount {\n    id\n    balance {\n      amount\n      currencyCode\n    }\n  }\n\n  #graphql\n  fragment StoreCreditTransaction on StoreCreditAccountTransaction {\n    ... on StoreCreditAccountCreditTransaction {\n      id\n      amount {\n        amount\n        currencyCode\n      }\n      balanceAfterTransaction {\n        amount\n        currencyCode\n      }\n      createdAt\n      expiresAt\n      remainingAmount {\n        amount\n        currencyCode\n      }\n    }\n    ... on StoreCreditAccountDebitTransaction {\n      id\n      amount {\n        amount\n        currencyCode\n      }\n      balanceAfterTransaction {\n        amount\n        currencyCode\n      }\n      createdAt\n    }\n  }\n\n": {
    return: CustomerStoreCreditQuery;
    variables: CustomerStoreCreditQueryVariables;
  };
  "#graphql\n  query CustomerStoreCreditBalance($language: LanguageCode) @inContext(language: $language) {\n    customer {\n      storeCreditAccounts(first: 10) {\n        nodes {\n          id\n          balance {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n": {
    return: CustomerStoreCreditBalanceQuery;
    variables: CustomerStoreCreditBalanceQueryVariables;
  };
  "#graphql\n  query CustomerSubscriptions(\n    $first: Int\n    $after: String\n    $last: Int\n    $before: String\n    $reverse: Boolean = false\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customer {\n      subscriptionContracts(\n        first: $first\n        after: $after\n        last: $last\n        before: $before\n        reverse: $reverse\n      ) {\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n        nodes {\n          id\n          status\n          createdAt\n          nextBillingDate\n          currencyCode\n          billingPolicy {\n            interval\n            intervalCount {\n              count\n            }\n          }\n          lines(first: 3) {\n            nodes {\n              id\n              name\n              title\n              quantity\n              currentPrice {\n                amount\n                currencyCode\n              }\n              image {\n                altText\n                url\n                width\n                height\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: CustomerSubscriptionsQuery;
    variables: CustomerSubscriptionsQueryVariables;
  };
  "#graphql\n  query CustomerSubscription($id: ID!, $language: LanguageCode) @inContext(language: $language) {\n    customer {\n      subscriptionContract(id: $id) {\n        ...SubscriptionContract\n        orders(first: 5, reverse: true) {\n          nodes {\n            id\n            name\n            processedAt\n            totalPrice {\n              amount\n              currencyCode\n            }\n            fulfillmentStatus\n          }\n        }\n        originOrder {\n          id\n          name\n          processedAt\n        }\n      }\n    }\n  }\n  #graphql\n  fragment SubscriptionContract on SubscriptionContract {\n    id\n    status\n    createdAt\n    updatedAt\n    nextBillingDate\n    currencyCode\n    note\n    deliveryPrice {\n      amount\n      currencyCode\n    }\n    billingPolicy {\n      ...SubscriptionBillingPolicy\n    }\n    deliveryPolicy {\n      ...SubscriptionDeliveryPolicy\n    }\n    lines(first: 10) {\n      nodes {\n        ...SubscriptionLine\n      }\n    }\n    upcomingBillingCycles(first: 5) {\n      nodes {\n        ...SubscriptionBillingCycle\n      }\n    }\n    lastPaymentStatus\n    lastBillingAttemptErrorType\n  }\n  #graphql\n  fragment SubscriptionLine on SubscriptionLine {\n    id\n    name\n    title\n    variantTitle\n    quantity\n    currentPrice {\n      amount\n      currencyCode\n    }\n    lineDiscountedPrice {\n      amount\n      currencyCode\n    }\n    image {\n      altText\n      url\n      width\n      height\n    }\n    sku\n  }\n\n  #graphql\n  fragment SubscriptionBillingPolicy on SubscriptionBillingPolicy {\n    interval\n    intervalCount {\n      count\n    }\n    minCycles\n    maxCycles\n  }\n\n  #graphql\n  fragment SubscriptionDeliveryPolicy on SubscriptionDeliveryPolicy {\n    interval\n    intervalCount {\n      count\n    }\n  }\n\n  #graphql\n  fragment SubscriptionBillingCycle on SubscriptionBillingCycle {\n    cycleIndex\n    cycleStartAt\n    cycleEndAt\n    billingAttemptExpectedDate\n    skipped\n    status\n  }\n\n\n": {
    return: CustomerSubscriptionQuery;
    variables: CustomerSubscriptionQueryVariables;
  };
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation customerAddressUpdate(\n    $address: CustomerAddressInput!\n    $addressId: ID!\n    $defaultAddress: Boolean\n    $language: LanguageCode\n ) @inContext(language: $language) {\n    customerAddressUpdate(\n      address: $address\n      addressId: $addressId\n      defaultAddress: $defaultAddress\n    ) {\n      customerAddress {\n        id\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerAddressUpdateMutation;
    variables: CustomerAddressUpdateMutationVariables;
  };
  "#graphql\n  mutation customerAddressDelete(\n    $addressId: ID!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerAddressDelete(addressId: $addressId) {\n      deletedAddressId\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerAddressDeleteMutation;
    variables: CustomerAddressDeleteMutationVariables;
  };
  "#graphql\n  mutation customerAddressCreate(\n    $address: CustomerAddressInput!\n    $defaultAddress: Boolean\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerAddressCreate(\n      address: $address\n      defaultAddress: $defaultAddress\n    ) {\n      customerAddress {\n        id\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerAddressCreateMutation;
    variables: CustomerAddressCreateMutationVariables;
  };
  "#graphql\n  mutation customerUpdate(\n    $customer: CustomerUpdateInput!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    customerUpdate(input: $customer) {\n      customer {\n        firstName\n        lastName\n        emailAddress {\n          emailAddress\n        }\n        phoneNumber {\n          phoneNumber\n        }\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerUpdateMutation;
    variables: CustomerUpdateMutationVariables;
  };
  "#graphql\n  mutation customerEmailMarketingSubscribe($language: LanguageCode) @inContext(language: $language) {\n    customerEmailMarketingSubscribe {\n      emailAddress {\n        emailAddress\n        marketingState\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerEmailMarketingSubscribeMutation;
    variables: CustomerEmailMarketingSubscribeMutationVariables;
  };
  "#graphql\n  mutation customerEmailMarketingUnsubscribe($language: LanguageCode) @inContext(language: $language) {\n    customerEmailMarketingUnsubscribe {\n      emailAddress {\n        emailAddress\n        marketingState\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerEmailMarketingUnsubscribeMutation;
    variables: CustomerEmailMarketingUnsubscribeMutationVariables;
  };
  "#graphql\n  mutation orderRequestReturn(\n    $orderId: ID!\n    $requestedLineItems: [RequestedLineItemInput!]!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    orderRequestReturn(\n      orderId: $orderId\n      requestedLineItems: $requestedLineItems\n    ) {\n      return {\n        id\n        name\n        status\n        createdAt\n        returnLineItems(first: 20) {\n          nodes {\n            id\n            quantity\n            returnReason\n            lineItem {\n              id\n              title\n              variantTitle\n            }\n          }\n        }\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: OrderRequestReturnMutation;
    variables: OrderRequestReturnMutationVariables;
  };
  "#graphql\n  mutation subscriptionContractPause(\n    $subscriptionContractId: ID!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    subscriptionContractPause(subscriptionContractId: $subscriptionContractId) {\n      contract {\n        id\n        status\n        updatedAt\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: SubscriptionContractPauseMutation;
    variables: SubscriptionContractPauseMutationVariables;
  };
  "#graphql\n  mutation subscriptionContractCancel(\n    $subscriptionContractId: ID!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {\n      contract {\n        id\n        status\n        updatedAt\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: SubscriptionContractCancelMutation;
    variables: SubscriptionContractCancelMutationVariables;
  };
  "#graphql\n  mutation subscriptionContractActivate(\n    $subscriptionContractId: ID!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    subscriptionContractActivate(subscriptionContractId: $subscriptionContractId) {\n      contract {\n        id\n        status\n        updatedAt\n        nextBillingDate\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: SubscriptionContractActivateMutation;
    variables: SubscriptionContractActivateMutationVariables;
  };
  "#graphql\n  mutation subscriptionBillingCycleSkip(\n    $billingCycleInput: SubscriptionBillingCycleInput!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    subscriptionBillingCycleSkip(billingCycleInput: $billingCycleInput) {\n      billingCycle {\n        cycleIndex\n        skipped\n        billingAttemptExpectedDate\n        status\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: SubscriptionBillingCycleSkipMutation;
    variables: SubscriptionBillingCycleSkipMutationVariables;
  };
  "#graphql\n  mutation subscriptionBillingCycleUnskip(\n    $billingCycleInput: SubscriptionBillingCycleInput!\n    $language: LanguageCode\n  ) @inContext(language: $language) {\n    subscriptionBillingCycleUnskip(billingCycleInput: $billingCycleInput) {\n      billingCycle {\n        cycleIndex\n        skipped\n        billingAttemptExpectedDate\n        status\n      }\n      userErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: SubscriptionBillingCycleUnskipMutation;
    variables: SubscriptionBillingCycleUnskipMutationVariables;
  };
}

declare module "@shopify/hydrogen" {
  interface CustomerAccountQueries extends GeneratedQueryTypes {}
  interface CustomerAccountMutations extends GeneratedMutationTypes {}
}
