/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontAPI from "@shopify/hydrogen/storefront-api-types";

export type MoneyFragment = Pick<
  StorefrontAPI.MoneyV2,
  "currencyCode" | "amount"
>;

export type CartLineFragment = Pick<
  StorefrontAPI.CartLine,
  "id" | "quantity"
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    | "id"
    | "availableForSale"
    | "quantityAvailable"
    | "requiresShipping"
    | "title"
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    product: Pick<StorefrontAPI.Product, "handle" | "title" | "id" | "vendor">;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, "name" | "value">
    >;
  };
  parentRelationship?: StorefrontAPI.Maybe<{
    parent: Pick<StorefrontAPI.CartLine, "id"> & {
      merchandise: Pick<StorefrontAPI.ProductVariant, "title"> & {
        product: Pick<StorefrontAPI.Product, "title" | "handle">;
      };
    };
  }>;
  sellingPlanAllocation?: StorefrontAPI.Maybe<{
    sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
      options: Array<Pick<StorefrontAPI.SellingPlanOption, "name" | "value">>;
    };
    priceAdjustments: Array<{
      perDeliveryPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    }>;
  }>;
};

export type CartLineComponentFragment = Pick<
  StorefrontAPI.ComponentizableCartLine,
  "id" | "quantity"
> & {
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  cost: {
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    amountPerQuantity: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  merchandise: Pick<
    StorefrontAPI.ProductVariant,
    | "id"
    | "availableForSale"
    | "quantityAvailable"
    | "requiresShipping"
    | "title"
  > & {
    compareAtPrice?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    product: Pick<StorefrontAPI.Product, "handle" | "title" | "id" | "vendor">;
    selectedOptions: Array<
      Pick<StorefrontAPI.SelectedOption, "name" | "value">
    >;
  };
  sellingPlanAllocation?: StorefrontAPI.Maybe<{
    sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
      options: Array<Pick<StorefrontAPI.SellingPlanOption, "name" | "value">>;
    };
    priceAdjustments: Array<{
      perDeliveryPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    }>;
  }>;
  lineComponents: Array<
    Pick<StorefrontAPI.CartLine, "id" | "quantity"> & {
      attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
      cost: {
        totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
        amountPerQuantity: Pick<
          StorefrontAPI.MoneyV2,
          "currencyCode" | "amount"
        >;
        compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
        >;
      };
      merchandise: Pick<
        StorefrontAPI.ProductVariant,
        | "id"
        | "availableForSale"
        | "quantityAvailable"
        | "requiresShipping"
        | "title"
      > & {
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        product: Pick<
          StorefrontAPI.Product,
          "handle" | "title" | "id" | "vendor"
        >;
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
      };
      parentRelationship?: StorefrontAPI.Maybe<{
        parent: Pick<StorefrontAPI.CartLine, "id"> & {
          merchandise: Pick<StorefrontAPI.ProductVariant, "title"> & {
            product: Pick<StorefrontAPI.Product, "title" | "handle">;
          };
        };
      }>;
      sellingPlanAllocation?: StorefrontAPI.Maybe<{
        sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
          options: Array<
            Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
          >;
        };
        priceAdjustments: Array<{
          perDeliveryPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        }>;
      }>;
    }
  >;
};

export type CartApiQueryFragment = Pick<
  StorefrontAPI.Cart,
  "updatedAt" | "id" | "checkoutUrl" | "totalQuantity" | "note"
> & {
  appliedGiftCards: Array<
    Pick<StorefrontAPI.AppliedGiftCard, "id" | "lastCharacters"> & {
      amountUsed: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
      balance: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    }
  >;
  buyerIdentity: Pick<
    StorefrontAPI.CartBuyerIdentity,
    "countryCode" | "email" | "phone"
  > & {
    customer?: StorefrontAPI.Maybe<
      Pick<
        StorefrontAPI.Customer,
        "id" | "email" | "firstName" | "lastName" | "displayName"
      >
    >;
  };
  lines: {
    nodes: Array<
      | (Pick<StorefrontAPI.CartLine, "id" | "quantity"> & {
          attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
          cost: {
            totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            amountPerQuantity: Pick<
              StorefrontAPI.MoneyV2,
              "currencyCode" | "amount"
            >;
            compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
          };
          merchandise: Pick<
            StorefrontAPI.ProductVariant,
            | "id"
            | "availableForSale"
            | "quantityAvailable"
            | "requiresShipping"
            | "title"
          > & {
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
            price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
            product: Pick<
              StorefrontAPI.Product,
              "handle" | "title" | "id" | "vendor"
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, "name" | "value">
            >;
          };
          parentRelationship?: StorefrontAPI.Maybe<{
            parent: Pick<StorefrontAPI.CartLine, "id"> & {
              merchandise: Pick<StorefrontAPI.ProductVariant, "title"> & {
                product: Pick<StorefrontAPI.Product, "title" | "handle">;
              };
            };
          }>;
          sellingPlanAllocation?: StorefrontAPI.Maybe<{
            sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
              options: Array<
                Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
              >;
            };
            priceAdjustments: Array<{
              perDeliveryPrice: Pick<
                StorefrontAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
            }>;
          }>;
        })
      | (Pick<StorefrontAPI.ComponentizableCartLine, "id" | "quantity"> & {
          attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
          cost: {
            totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            amountPerQuantity: Pick<
              StorefrontAPI.MoneyV2,
              "currencyCode" | "amount"
            >;
            compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
          };
          merchandise: Pick<
            StorefrontAPI.ProductVariant,
            | "id"
            | "availableForSale"
            | "quantityAvailable"
            | "requiresShipping"
            | "title"
          > & {
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
            >;
            price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
            product: Pick<
              StorefrontAPI.Product,
              "handle" | "title" | "id" | "vendor"
            >;
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, "name" | "value">
            >;
          };
          sellingPlanAllocation?: StorefrontAPI.Maybe<{
            sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
              options: Array<
                Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
              >;
            };
            priceAdjustments: Array<{
              perDeliveryPrice: Pick<
                StorefrontAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
            }>;
          }>;
          lineComponents: Array<
            Pick<StorefrontAPI.CartLine, "id" | "quantity"> & {
              attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
              cost: {
                totalAmount: Pick<
                  StorefrontAPI.MoneyV2,
                  "currencyCode" | "amount"
                >;
                amountPerQuantity: Pick<
                  StorefrontAPI.MoneyV2,
                  "currencyCode" | "amount"
                >;
                compareAtAmountPerQuantity?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
                >;
              };
              merchandise: Pick<
                StorefrontAPI.ProductVariant,
                | "id"
                | "availableForSale"
                | "quantityAvailable"
                | "requiresShipping"
                | "title"
              > & {
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
                image?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    "id" | "url" | "altText" | "width" | "height"
                  >
                >;
                product: Pick<
                  StorefrontAPI.Product,
                  "handle" | "title" | "id" | "vendor"
                >;
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
              };
              parentRelationship?: StorefrontAPI.Maybe<{
                parent: Pick<StorefrontAPI.CartLine, "id"> & {
                  merchandise: Pick<StorefrontAPI.ProductVariant, "title"> & {
                    product: Pick<StorefrontAPI.Product, "title" | "handle">;
                  };
                };
              }>;
              sellingPlanAllocation?: StorefrontAPI.Maybe<{
                sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
                  options: Array<
                    Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
                  >;
                };
                priceAdjustments: Array<{
                  perDeliveryPrice: Pick<
                    StorefrontAPI.MoneyV2,
                    "amount" | "currencyCode"
                  >;
                }>;
              }>;
            }
          >;
        })
    >;
  };
  cost: {
    subtotalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    totalAmount: Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">;
    totalDutyAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
    totalTaxAmount?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.MoneyV2, "currencyCode" | "amount">
    >;
  };
  attributes: Array<Pick<StorefrontAPI.Attribute, "key" | "value">>;
  discountCodes: Array<
    Pick<StorefrontAPI.CartDiscountCode, "code" | "applicable">
  >;
};

export type MenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
>;

export type ChildMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
>;

export type ParentMenuItemFragment = Pick<
  StorefrontAPI.MenuItem,
  "id" | "resourceId" | "tags" | "title" | "type" | "url"
> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      "id" | "resourceId" | "tags" | "title" | "type" | "url"
    >
  >;
};

export type MenuFragment = Pick<StorefrontAPI.Menu, "id"> & {
  items: Array<
    Pick<
      StorefrontAPI.MenuItem,
      "id" | "resourceId" | "tags" | "title" | "type" | "url"
    > & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          "id" | "resourceId" | "tags" | "title" | "type" | "url"
        >
      >;
    }
  >;
};

export type ShopFragment = Pick<
  StorefrontAPI.Shop,
  "id" | "name" | "description"
> & {
  primaryDomain: Pick<StorefrontAPI.Domain, "url">;
  brand?: StorefrontAPI.Maybe<{
    logo?: StorefrontAPI.Maybe<{
      image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
    }>;
  }>;
};

export type HeaderQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  headerMenuHandle: StorefrontAPI.Scalars["String"]["input"];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HeaderQuery = {
  shop: Pick<StorefrontAPI.Shop, "id" | "name" | "description"> & {
    primaryDomain: Pick<StorefrontAPI.Domain, "url">;
    brand?: StorefrontAPI.Maybe<{
      logo?: StorefrontAPI.Maybe<{
        image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
      }>;
    }>;
  };
  menu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, "id"> & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          "id" | "resourceId" | "tags" | "title" | "type" | "url"
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              "id" | "resourceId" | "tags" | "title" | "type" | "url"
            >
          >;
        }
      >;
    }
  >;
};

export type FooterQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  footerMenuHandle: StorefrontAPI.Scalars["String"]["input"];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type FooterQuery = {
  menu?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Menu, "id"> & {
      items: Array<
        Pick<
          StorefrontAPI.MenuItem,
          "id" | "resourceId" | "tags" | "title" | "type" | "url"
        > & {
          items: Array<
            Pick<
              StorefrontAPI.MenuItem,
              "id" | "resourceId" | "tags" | "title" | "type" | "url"
            >
          >;
        }
      >;
    }
  >;
};

export type MenuCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type MenuCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
      }
    >;
  };
  allProducts: {
    pageInfo: Pick<StorefrontAPI.PageInfo, "hasNextPage">;
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "productType" | "availableForSale"
      > & {
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type ProductExistsQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars["String"]["input"];
}>;

export type ProductExistsQuery = {
  product?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Product, "id">>;
};

export type SiteSettingsFragment = Pick<
  StorefrontAPI.Metaobject,
  "id" | "handle"
> & {
  brandName?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  brandWords?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  missionStatement?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  brandLogo?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "MediaImage" } & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  }>;
  heroHeading?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  heroDescription?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  featuredProductSection?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        | "id"
        | "handle"
        | "title"
        | "vendor"
        | "description"
        | "availableForSale"
        | "tags"
      > & {
          featuredImage?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.ProductVariant, "id" | "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            }
          >;
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >;
  }>;
  heroMediaMobile?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({ __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        })
      | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
            sources: Array<Pick<StorefrontAPI.VideoSource, "url" | "mimeType">>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText">
            >;
          })
    >;
  }>;
  heroMediaLargeScreen?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({ __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        })
      | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
            sources: Array<Pick<StorefrontAPI.VideoSource, "url" | "mimeType">>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText">
            >;
          })
    >;
  }>;
  siteUrl?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  contactEmail?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  contactPhone?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  businessHours?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  streetAddress?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  city?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  state?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  zipCode?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  blogSectionTitle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  collectionsTitle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  relatedProductsTitle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  recommendedTitle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  instagramTitle?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  galleryPageHeading?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  galleryPageDescription?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  blogPageHeading?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  blogPageDescription?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  announcementBanner?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  promotionalBannerOneMedia?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({ __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        })
      | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
            sources: Array<Pick<StorefrontAPI.VideoSource, "url" | "mimeType">>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText">
            >;
          })
    >;
  }>;
  promotionalBannerTwoMedia?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      | ({ __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        })
      | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
            sources: Array<Pick<StorefrontAPI.VideoSource, "url" | "mimeType">>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText">
            >;
          })
    >;
  }>;
  messengerId?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  whatsappNumber?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  socialLinksData?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  testimonialsData?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  faqItemsData?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  instagramMediaData?: StorefrontAPI.Maybe<{
    references?: StorefrontAPI.Maybe<{
      nodes: Array<
        | ({ __typename: "MediaImage" } & Pick<
            StorefrontAPI.MediaImage,
            "id"
          > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
        | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "id" | "alt"> & {
              sources: Array<
                Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
              >;
              previewImage?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.Image, "url" | "altText">
              >;
            })
      >;
    }>;
  }>;
  favicon?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "MediaImage" } & {
        image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
      }
    >;
  }>;
  icon192?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "MediaImage" } & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  }>;
  icon512?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "MediaImage" } & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  }>;
  icon180Apple?: StorefrontAPI.Maybe<{
    reference?: StorefrontAPI.Maybe<
      { __typename: "MediaImage" } & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  }>;
};

export type ThemeSettingsFragment = Pick<
  StorefrontAPI.Metaobject,
  "id" | "handle"
> & {
  fontBody?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  fontHeading?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  fontPrice?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
  borderRadius?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  colorPrimary?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  colorSecondary?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  colorBackground?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  colorForeground?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
  colorAccent?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MetaobjectField, "value">
  >;
};

export type SiteContentQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SiteContentQuery = {
  siteSettings?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "handle"> & {
      brandName?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      brandWords?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      missionStatement?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      brandLogo?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      heroHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      heroDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      featuredProductSection?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "Product" } & Pick<
            StorefrontAPI.Product,
            | "id"
            | "handle"
            | "title"
            | "vendor"
            | "description"
            | "availableForSale"
            | "tags"
          > & {
              featuredImage?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
              priceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                maxVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              compareAtPriceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.ProductVariant,
                  "id" | "availableForSale"
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      "url" | "altText" | "width" | "height"
                    >
                  >;
                }
              >;
              variants: {
                nodes: Array<
                  Pick<
                    StorefrontAPI.ProductVariant,
                    "id" | "title" | "availableForSale"
                  > & {
                    selectedOptions: Array<
                      Pick<StorefrontAPI.SelectedOption, "name" | "value">
                    >;
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                    >;
                  }
                >;
              };
            }
        >;
      }>;
      heroMediaMobile?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      heroMediaLargeScreen?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      siteUrl?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      contactEmail?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      contactPhone?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      businessHours?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      streetAddress?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      city?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
      state?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
      zipCode?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogSectionTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      collectionsTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      relatedProductsTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      recommendedTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      instagramTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      galleryPageHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      galleryPageDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogPageHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogPageDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      announcementBanner?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      promotionalBannerOneMedia?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      promotionalBannerTwoMedia?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      messengerId?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      whatsappNumber?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      socialLinksData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      testimonialsData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      faqItemsData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      instagramMediaData?: StorefrontAPI.Maybe<{
        references?: StorefrontAPI.Maybe<{
          nodes: Array<
            | ({ __typename: "MediaImage" } & Pick<
                StorefrontAPI.MediaImage,
                "id"
              > & {
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      "url" | "altText" | "width" | "height"
                    >
                  >;
                })
            | ({ __typename: "Video" } & Pick<
                StorefrontAPI.Video,
                "id" | "alt"
              > & {
                  sources: Array<
                    Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                  >;
                  previewImage?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, "url" | "altText">
                  >;
                })
          >;
        }>;
      }>;
      favicon?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
          }
        >;
      }>;
      icon192?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      icon512?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      icon180Apple?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
    }
  >;
};

export type ThemeSettingsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ThemeSettingsQuery = {
  themeSettings?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "handle"> & {
      fontBody?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      fontHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      fontPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      borderRadius?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorPrimary?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorSecondary?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorBackground?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorForeground?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorAccent?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
    }
  >;
};

export type PwaManifestQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type PwaManifestQuery = {
  siteSettings?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "handle"> & {
      brandName?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      brandWords?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      missionStatement?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      brandLogo?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      heroHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      heroDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      featuredProductSection?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "Product" } & Pick<
            StorefrontAPI.Product,
            | "id"
            | "handle"
            | "title"
            | "vendor"
            | "description"
            | "availableForSale"
            | "tags"
          > & {
              featuredImage?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
              priceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                maxVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              compareAtPriceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.ProductVariant,
                  "id" | "availableForSale"
                > & {
                  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                  >;
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      "url" | "altText" | "width" | "height"
                    >
                  >;
                }
              >;
              variants: {
                nodes: Array<
                  Pick<
                    StorefrontAPI.ProductVariant,
                    "id" | "title" | "availableForSale"
                  > & {
                    selectedOptions: Array<
                      Pick<StorefrontAPI.SelectedOption, "name" | "value">
                    >;
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                    >;
                  }
                >;
              };
            }
        >;
      }>;
      heroMediaMobile?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      heroMediaLargeScreen?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      siteUrl?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      contactEmail?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      contactPhone?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      businessHours?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      streetAddress?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      city?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
      state?: StorefrontAPI.Maybe<Pick<StorefrontAPI.MetaobjectField, "value">>;
      zipCode?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogSectionTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      collectionsTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      relatedProductsTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      recommendedTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      instagramTitle?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      galleryPageHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      galleryPageDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogPageHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      blogPageDescription?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      announcementBanner?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      promotionalBannerOneMedia?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      promotionalBannerTwoMedia?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          | ({ __typename: "MediaImage" } & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
            })
          | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "alt"> & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url" | "altText">
                >;
              })
        >;
      }>;
      messengerId?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      whatsappNumber?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      socialLinksData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      testimonialsData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      faqItemsData?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      instagramMediaData?: StorefrontAPI.Maybe<{
        references?: StorefrontAPI.Maybe<{
          nodes: Array<
            | ({ __typename: "MediaImage" } & Pick<
                StorefrontAPI.MediaImage,
                "id"
              > & {
                  image?: StorefrontAPI.Maybe<
                    Pick<
                      StorefrontAPI.Image,
                      "url" | "altText" | "width" | "height"
                    >
                  >;
                })
            | ({ __typename: "Video" } & Pick<
                StorefrontAPI.Video,
                "id" | "alt"
              > & {
                  sources: Array<
                    Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                  >;
                  previewImage?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.Image, "url" | "altText">
                  >;
                })
          >;
        }>;
      }>;
      favicon?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
          }
        >;
      }>;
      icon192?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      icon512?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
      icon180Apple?: StorefrontAPI.Maybe<{
        reference?: StorefrontAPI.Maybe<
          { __typename: "MediaImage" } & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          }
        >;
      }>;
    }
  >;
  themeSettings?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metaobject, "id" | "handle"> & {
      fontBody?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      fontHeading?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      fontPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      borderRadius?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorPrimary?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorSecondary?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorBackground?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorForeground?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
      colorAccent?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MetaobjectField, "value">
      >;
    }
  >;
};

export type ShopShippingMetafieldFragment = {
  freeShippingThreshold?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Metafield, "value" | "type">
  >;
};

export type CartSuggestionProductFragment = Pick<
  StorefrontAPI.Product,
  "id" | "title" | "handle" | "availableForSale"
> & {
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
  >;
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        "id" | "title" | "availableForSale"
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      }
    >;
  };
};

export type CartSuggestionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type CartSuggestionsQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale"
      > & {
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
            }
          >;
        };
      }
    >;
  };
};

export type ShopShippingConfigQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ShopShippingConfigQuery = {
  shop: {
    freeShippingThreshold?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Metafield, "value" | "type">
    >;
    paymentSettings: Pick<StorefrontAPI.PaymentSettings, "currencyCode">;
  };
};

export type HasBlogQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HasBlogQuery = {
  articles: { nodes: Array<Pick<StorefrontAPI.Article, "id">> };
};

export type StoreRobotsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type StoreRobotsQuery = { shop: Pick<StorefrontAPI.Shop, "id"> };

export type CuratedProductFragment = Pick<
  StorefrontAPI.Product,
  "id" | "title" | "handle" | "availableForSale" | "tags"
> & {
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
  >;
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
  };
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        "id" | "title" | "availableForSale"
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
};

export type CuratedCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type CuratedCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        products: {
          nodes: Array<
            Pick<
              StorefrontAPI.Product,
              "id" | "title" | "handle" | "availableForSale" | "tags"
            > & {
              priceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                maxVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              compareAtPriceRange: {
                minVariantPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              };
              featuredImage?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "id" | "url" | "altText" | "width" | "height"
                >
              >;
              images: {
                nodes: Array<
                  Pick<
                    StorefrontAPI.Image,
                    "id" | "url" | "altText" | "width" | "height"
                  >
                >;
              };
              variants: {
                nodes: Array<
                  Pick<
                    StorefrontAPI.ProductVariant,
                    "id" | "title" | "availableForSale"
                  > & {
                    selectedOptions: Array<
                      Pick<StorefrontAPI.SelectedOption, "name" | "value">
                    >;
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                    >;
                  }
                >;
              };
            }
          >;
        };
      }
    >;
  };
};

export type HomeRecentlyViewedProductsQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HomeRecentlyViewedProductsQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "tags"
      > & {
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >
  >;
};

export type AllProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type AllProductsQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "tags"
      > & {
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type HeroCollectionFragment = Pick<
  StorefrontAPI.Collection,
  "id" | "handle" | "title" | "description"
> & {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
  >;
};

export type HeroCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type HeroCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<
        StorefrontAPI.Collection,
        "id" | "handle" | "title" | "description"
      > & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
      }
    >;
  };
};

export type ExploreCollectionFragment = Pick<
  StorefrontAPI.Collection,
  "id" | "handle" | "title" | "description"
> & {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
  >;
};

export type ExploreCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ExploreCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<
        StorefrontAPI.Collection,
        "id" | "handle" | "title" | "description"
      > & {
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
      }
    >;
  };
};

export type ProductHandlesQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ProductHandlesQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<StorefrontAPI.Product, "id" | "handle">
    >
  >;
};

export type HomepageArticleFragment = Pick<
  StorefrontAPI.Article,
  "handle" | "title" | "excerpt" | "publishedAt"
> & {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
  >;
  blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
  author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, "name">>;
};

export type RecentBlogArticlesQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type RecentBlogArticlesQuery = {
  blogs: {
    nodes: Array<{
      articles: {
        nodes: Array<
          Pick<
            StorefrontAPI.Article,
            "handle" | "title" | "excerpt" | "publishedAt"
          > & {
            image?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
            blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, "name">
            >;
          }
        >;
      };
    }>;
  };
};

export type AccountRecentlyViewedProductsQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type AccountRecentlyViewedProductsQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "tags"
      > & {
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >
  >;
};

export type RecommendedProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type RecommendedProductsQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "tags"
      > & {
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type AllProductsForDashboardQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type AllProductsForDashboardQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "tags"
      > & {
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type OrderProductHandlesQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type OrderProductHandlesQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<StorefrontAPI.Product, "id" | "handle">
    >
  >;
};

export type CustomerCreateMutationVariables = StorefrontAPI.Exact<{
  input: StorefrontAPI.CustomerCreateInput;
}>;

export type CustomerCreateMutation = {
  customerCreate?: StorefrontAPI.Maybe<{
    customer?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Customer, "id" | "email">
    >;
    customerUserErrors: Array<
      Pick<StorefrontAPI.CustomerUserError, "code" | "field" | "message">
    >;
  }>;
};

export type ProductRecommendationsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  productId: StorefrontAPI.Scalars["ID"]["input"];
}>;

export type ProductRecommendationsQuery = {
  productRecommendations?: StorefrontAPI.Maybe<
    Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale"
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale" | "quantityAvailable"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >
  >;
};

export type QuickAddProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars["String"]["input"];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type QuickAddProductQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | "id"
      | "title"
      | "handle"
      | "description"
      | "tags"
      | "vendor"
      | "productType"
      | "availableForSale"
    > & {
      featuredImage?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
      >;
      images: {
        nodes: Array<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
      };
      options: Array<
        Pick<StorefrontAPI.ProductOption, "name"> & {
          optionValues: Array<Pick<StorefrontAPI.ProductOptionValue, "name">>;
        }
      >;
      priceRange: {
        minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      };
      variants: {
        nodes: Array<
          Pick<
            StorefrontAPI.ProductVariant,
            "id" | "title" | "availableForSale" | "quantityAvailable"
          > & {
            selectedOptions: Array<
              Pick<StorefrontAPI.SelectedOption, "name" | "value">
            >;
            price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
            >;
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          }
        >;
      };
      seo: Pick<StorefrontAPI.Seo, "title" | "description">;
    }
  >;
};

export type WishlistProductFragment = { __typename: "Product" } & Pick<
  StorefrontAPI.Product,
  "id" | "title" | "handle" | "availableForSale"
> & {
    featuredImage?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    images: {
      nodes: Array<
        Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
      >;
    };
    priceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    compareAtPriceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    variants: {
      nodes: Array<
        Pick<
          StorefrontAPI.ProductVariant,
          "id" | "title" | "availableForSale"
        > & {
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, "name" | "value">
          >;
          price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
        }
      >;
    };
  };

export type WishlistProductsQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
}>;

export type WishlistProductsQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale"
      > & {
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >
  >;
};

export type AppleTouchIconQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type AppleTouchIconQuery = {
  siteSettings?: StorefrontAPI.Maybe<{
    brandLogo?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
      >;
    }>;
    icon180Apple?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
      >;
    }>;
    icon192?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
      >;
    }>;
  }>;
};

export type ArticleQueryVariables = StorefrontAPI.Exact<{
  articleHandle: StorefrontAPI.Scalars["String"]["input"];
  blogHandle: StorefrontAPI.Scalars["String"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ArticleQuery = {
  blog?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Blog, "handle" | "title"> & {
      articleByHandle?: StorefrontAPI.Maybe<
        Pick<
          StorefrontAPI.Article,
          | "handle"
          | "title"
          | "content"
          | "contentHtml"
          | "excerpt"
          | "excerptHtml"
          | "publishedAt"
          | "tags"
        > & {
          author?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.ArticleAuthor,
              "name" | "bio" | "firstName" | "lastName"
            >
          >;
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "altText" | "url" | "width" | "height"
            >
          >;
          seo?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Seo, "description" | "title">
          >;
        }
      >;
      articles: {
        nodes: Array<
          Pick<
            StorefrontAPI.Article,
            | "handle"
            | "title"
            | "excerpt"
            | "excerptHtml"
            | "content"
            | "contentHtml"
            | "publishedAt"
            | "tags"
          > & {
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "altText" | "url" | "width" | "height"
              >
            >;
            blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, "name">
            >;
          }
        >;
      };
    }
  >;
};

export type BlogQueryVariables = StorefrontAPI.Exact<{
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  blogHandle: StorefrontAPI.Scalars["String"]["input"];
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
}>;

export type BlogQuery = {
  blog?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Blog, "title" | "handle"> & {
      seo?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Seo, "title" | "description">
      >;
      articles: {
        nodes: Array<
          Pick<
            StorefrontAPI.Article,
            | "handle"
            | "title"
            | "excerpt"
            | "excerptHtml"
            | "content"
            | "contentHtml"
            | "publishedAt"
            | "tags"
          > & {
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "altText" | "url" | "width" | "height"
              >
            >;
            blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
            author?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.ArticleAuthor, "name">
            >;
          }
        >;
        pageInfo: Pick<
          StorefrontAPI.PageInfo,
          "hasPreviousPage" | "hasNextPage" | "endCursor" | "startCursor"
        >;
      };
    }
  >;
};

export type BlogsWithArticlesQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
}>;

export type BlogsWithArticlesQuery = {
  blogs: {
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
    nodes: Array<
      Pick<StorefrontAPI.Blog, "title" | "handle"> & {
        seo?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Seo, "title" | "description">
        >;
        articles: {
          nodes: Array<
            Pick<
              StorefrontAPI.Article,
              | "handle"
              | "title"
              | "excerpt"
              | "excerptHtml"
              | "content"
              | "contentHtml"
              | "publishedAt"
              | "tags"
            > & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "id" | "altText" | "url" | "width" | "height"
                >
              >;
              blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
              author?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.ArticleAuthor, "name">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type LatestArticlesQueryVariables = StorefrontAPI.Exact<{
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type LatestArticlesQuery = {
  articles: {
    nodes: Array<
      Pick<
        StorefrontAPI.Article,
        | "handle"
        | "title"
        | "excerpt"
        | "excerptHtml"
        | "content"
        | "contentHtml"
        | "publishedAt"
        | "tags"
      > & {
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "altText" | "url" | "width" | "height"
          >
        >;
        blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
        author?: StorefrontAPI.Maybe<Pick<StorefrontAPI.ArticleAuthor, "name">>;
      }
    >;
  };
};

export type MoneyProductItemFragment = Pick<
  StorefrontAPI.MoneyV2,
  "amount" | "currencyCode"
>;

export type ProductItemFragment = Pick<
  StorefrontAPI.Product,
  "id" | "handle" | "title" | "availableForSale" | "tags"
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "altText" | "url" | "width" | "height">
  >;
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
  };
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        "id" | "title" | "availableForSale"
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
};

export type CollectionQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars["String"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  sortKey?: StorefrontAPI.InputMaybe<StorefrontAPI.ProductCollectionSortKeys>;
  reverse?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Boolean"]["input"]>;
  filters?: StorefrontAPI.InputMaybe<
    Array<StorefrontAPI.ProductFilter> | StorefrontAPI.ProductFilter
  >;
}>;

export type CollectionQuery = {
  collection?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Collection,
      "id" | "handle" | "title" | "description"
    > & {
      seo: Pick<StorefrontAPI.Seo, "title" | "description">;
      image?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
      >;
      products: {
        nodes: Array<
          Pick<
            StorefrontAPI.Product,
            "id" | "handle" | "title" | "availableForSale" | "tags"
          > & {
            featuredImage?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "altText" | "url" | "width" | "height"
              >
            >;
            images: {
              nodes: Array<
                Pick<
                  StorefrontAPI.Image,
                  "id" | "url" | "altText" | "width" | "height"
                >
              >;
            };
            priceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
              maxVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
            };
            compareAtPriceRange: {
              minVariantPrice: Pick<
                StorefrontAPI.MoneyV2,
                "amount" | "currencyCode"
              >;
            };
            variants: {
              nodes: Array<
                Pick<
                  StorefrontAPI.ProductVariant,
                  "id" | "title" | "availableForSale"
                > & {
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, "name" | "value">
                  >;
                  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                  >;
                }
              >;
            };
          }
        >;
        pageInfo: Pick<
          StorefrontAPI.PageInfo,
          "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
        >;
      };
    }
  >;
};

export type SidebarCollectionsHandleQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SidebarCollectionsHandleQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
      }
    >;
  };
  allProducts: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "id" | "availableForSale"> & {
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type CollectionCountQueryVariables = StorefrontAPI.Exact<{
  handle: StorefrontAPI.Scalars["String"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type CollectionCountQuery = {
  collection?: StorefrontAPI.Maybe<{
    products: {
      nodes: Array<Pick<StorefrontAPI.Product, "id">>;
      pageInfo: Pick<StorefrontAPI.PageInfo, "hasNextPage">;
    };
  }>;
};

export type CollectionFragment = Pick<
  StorefrontAPI.Collection,
  "id" | "title" | "handle"
> & {
  products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
  >;
};

export type StoreCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
}>;

export type StoreCollectionsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "title" | "handle"> & {
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
        image?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
  };
};

export type SaleProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
}>;

export type SaleProductsQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "id" | "availableForSale"> & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type MoneyCollectionItemFragment = Pick<
  StorefrontAPI.MoneyV2,
  "amount" | "currencyCode"
>;

export type CollectionItemFragment = Pick<
  StorefrontAPI.Product,
  "id" | "handle" | "title" | "availableForSale" | "tags"
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "altText" | "url" | "width" | "height">
  >;
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
  };
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        "id" | "title" | "availableForSale"
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
};

export type CatalogQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  sortKey?: StorefrontAPI.InputMaybe<StorefrontAPI.ProductSortKeys>;
  reverse?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Boolean"]["input"]>;
}>;

export type CatalogQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "handle" | "title" | "availableForSale" | "tags"
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "altText" | "url" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
  };
};

export type SidebarCollectionsAllQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SidebarCollectionsAllQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
      }
    >;
  };
  allProducts: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "id" | "availableForSale"> & {
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type FaviconQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type FaviconQuery = {
  siteSettings?: StorefrontAPI.Maybe<{
    brandLogo?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
      >;
    }>;
    favicon?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Image, "url">>;
        }
      >;
    }>;
    icon192?: StorefrontAPI.Maybe<{
      reference?: StorefrontAPI.Maybe<
        { __typename: "MediaImage" } & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
      >;
    }>;
  }>;
};

export type GalleryProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first: StorefrontAPI.Scalars["Int"]["input"];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["String"]["input"]>;
}>;

export type GalleryProductsQuery = {
  products: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "handle" | "title"> & {
        collections: {
          nodes: Array<Pick<StorefrontAPI.Collection, "handle" | "title">>;
        };
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
      }
    >;
    pageInfo: Pick<StorefrontAPI.PageInfo, "hasNextPage" | "endCursor">;
  };
};

export type PolicyFragment = Pick<
  StorefrontAPI.ShopPolicy,
  "body" | "handle" | "id" | "title" | "url"
>;

export type PolicyQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  privacyPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  refundPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  shippingPolicy: StorefrontAPI.Scalars["Boolean"]["input"];
  termsOfService: StorefrontAPI.Scalars["Boolean"]["input"];
}>;

export type PolicyQuery = {
  shop: {
    privacyPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    shippingPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    termsOfService?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
    refundPolicy?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ShopPolicy, "body" | "handle" | "id" | "title" | "url">
    >;
  };
};

export type ProductVariantFragment = Pick<
  StorefrontAPI.ProductVariant,
  "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
> & {
  compareAtPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
  >;
  image?: StorefrontAPI.Maybe<
    { __typename: "Image" } & Pick<
      StorefrontAPI.Image,
      "id" | "url" | "altText" | "width" | "height"
    >
  >;
  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  product: Pick<StorefrontAPI.Product, "title" | "handle">;
  selectedOptions: Array<Pick<StorefrontAPI.SelectedOption, "name" | "value">>;
  unitPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
  >;
  sellingPlanAllocations: {
    nodes: Array<{
      sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
        options: Array<Pick<StorefrontAPI.SellingPlanOption, "name" | "value">>;
        priceAdjustments: Array<{
          adjustmentValue:
            | ({ __typename: "SellingPlanFixedAmountPriceAdjustment" } & {
                adjustmentAmount: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              })
            | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              })
            | ({ __typename: "SellingPlanPercentagePriceAdjustment" } & Pick<
                StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                "adjustmentPercentage"
              >);
        }>;
      };
      priceAdjustments: Array<{
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        perDeliveryPrice: Pick<
          StorefrontAPI.MoneyV2,
          "amount" | "currencyCode"
        >;
      }>;
    }>;
  };
};

export type ProductFragment = Pick<
  StorefrontAPI.Product,
  | "id"
  | "title"
  | "vendor"
  | "handle"
  | "descriptionHtml"
  | "description"
  | "tags"
  | "encodedVariantExistence"
  | "encodedVariantAvailability"
  | "requiresSellingPlan"
> & {
  sizeChart?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, "value">>;
  collections: {
    nodes: Array<Pick<StorefrontAPI.Collection, "handle" | "title">>;
  };
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
  };
  media: {
    nodes: Array<
      | { __typename: "ExternalVideo" | "Model3d" }
      | ({ __typename: "MediaImage" } & Pick<
          StorefrontAPI.MediaImage,
          "id" | "alt"
        > & {
            image?: StorefrontAPI.Maybe<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          })
      | ({ __typename: "Video" } & Pick<StorefrontAPI.Video, "id" | "alt"> & {
            sources: Array<Pick<StorefrontAPI.VideoSource, "url" | "mimeType">>;
            previewImage?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
            >;
          })
    >;
  };
  variants: {
    nodes: Array<
      Pick<StorefrontAPI.ProductVariant, "id" | "availableForSale"> & {
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
  options: Array<
    Pick<StorefrontAPI.ProductOption, "name"> & {
      optionValues: Array<
        Pick<StorefrontAPI.ProductOptionValue, "name"> & {
          firstSelectableVariant?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.ProductVariant,
              "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
            > & {
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
              image?: StorefrontAPI.Maybe<
                { __typename: "Image" } & Pick<
                  StorefrontAPI.Image,
                  "id" | "url" | "altText" | "width" | "height"
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              product: Pick<StorefrontAPI.Product, "title" | "handle">;
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              unitPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
              sellingPlanAllocations: {
                nodes: Array<{
                  sellingPlan: Pick<
                    StorefrontAPI.SellingPlan,
                    "id" | "name"
                  > & {
                    options: Array<
                      Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
                    >;
                    priceAdjustments: Array<{
                      adjustmentValue:
                        | ({
                            __typename: "SellingPlanFixedAmountPriceAdjustment";
                          } & {
                            adjustmentAmount: Pick<
                              StorefrontAPI.MoneyV2,
                              "amount" | "currencyCode"
                            >;
                          })
                        | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                            price: Pick<
                              StorefrontAPI.MoneyV2,
                              "amount" | "currencyCode"
                            >;
                          })
                        | ({
                            __typename: "SellingPlanPercentagePriceAdjustment";
                          } & Pick<
                            StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                            "adjustmentPercentage"
                          >);
                    }>;
                  };
                  priceAdjustments: Array<{
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    compareAtPrice: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                    perDeliveryPrice: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  }>;
                }>;
              };
            }
          >;
          swatch?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.ProductOptionValueSwatch, "color"> & {
              image?: StorefrontAPI.Maybe<{
                previewImage?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.Image, "url">
                >;
              }>;
            }
          >;
        }
      >;
    }
  >;
  selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.ProductVariant,
      "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
    > & {
      compareAtPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
      >;
      image?: StorefrontAPI.Maybe<
        { __typename: "Image" } & Pick<
          StorefrontAPI.Image,
          "id" | "url" | "altText" | "width" | "height"
        >
      >;
      price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      product: Pick<StorefrontAPI.Product, "title" | "handle">;
      selectedOptions: Array<
        Pick<StorefrontAPI.SelectedOption, "name" | "value">
      >;
      unitPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
      >;
      sellingPlanAllocations: {
        nodes: Array<{
          sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
            options: Array<
              Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
            >;
            priceAdjustments: Array<{
              adjustmentValue:
                | ({ __typename: "SellingPlanFixedAmountPriceAdjustment" } & {
                    adjustmentAmount: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  })
                | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  })
                | ({
                    __typename: "SellingPlanPercentagePriceAdjustment";
                  } & Pick<
                    StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                    "adjustmentPercentage"
                  >);
            }>;
          };
          priceAdjustments: Array<{
            price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            perDeliveryPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          }>;
        }>;
      };
    }
  >;
  adjacentVariants: Array<
    Pick<
      StorefrontAPI.ProductVariant,
      "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
    > & {
      compareAtPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
      >;
      image?: StorefrontAPI.Maybe<
        { __typename: "Image" } & Pick<
          StorefrontAPI.Image,
          "id" | "url" | "altText" | "width" | "height"
        >
      >;
      price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      product: Pick<StorefrontAPI.Product, "title" | "handle">;
      selectedOptions: Array<
        Pick<StorefrontAPI.SelectedOption, "name" | "value">
      >;
      unitPrice?: StorefrontAPI.Maybe<
        Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
      >;
      sellingPlanAllocations: {
        nodes: Array<{
          sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
            options: Array<
              Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
            >;
            priceAdjustments: Array<{
              adjustmentValue:
                | ({ __typename: "SellingPlanFixedAmountPriceAdjustment" } & {
                    adjustmentAmount: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  })
                | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                    price: Pick<
                      StorefrontAPI.MoneyV2,
                      "amount" | "currencyCode"
                    >;
                  })
                | ({
                    __typename: "SellingPlanPercentagePriceAdjustment";
                  } & Pick<
                    StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                    "adjustmentPercentage"
                  >);
            }>;
          };
          priceAdjustments: Array<{
            price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            perDeliveryPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          }>;
        }>;
      };
    }
  >;
  seo: Pick<StorefrontAPI.Seo, "description" | "title">;
  sellingPlanGroups: {
    nodes: Array<
      Pick<StorefrontAPI.SellingPlanGroup, "name" | "appName"> & {
        options: Array<
          Pick<StorefrontAPI.SellingPlanGroupOption, "name" | "values">
        >;
        sellingPlans: {
          nodes: Array<
            Pick<
              StorefrontAPI.SellingPlan,
              "id" | "name" | "description" | "recurringDeliveries"
            > & {
              options: Array<
                Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
              >;
              priceAdjustments: Array<{
                adjustmentValue:
                  | ({ __typename: "SellingPlanFixedAmountPriceAdjustment" } & {
                      adjustmentAmount: Pick<
                        StorefrontAPI.MoneyV2,
                        "amount" | "currencyCode"
                      >;
                    })
                  | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                      price: Pick<
                        StorefrontAPI.MoneyV2,
                        "amount" | "currencyCode"
                      >;
                    })
                  | ({
                      __typename: "SellingPlanPercentagePriceAdjustment";
                    } & Pick<
                      StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                      "adjustmentPercentage"
                    >);
              }>;
            }
          >;
        };
      }
    >;
  };
};

export type ProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  handle: StorefrontAPI.Scalars["String"]["input"];
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  selectedOptions:
    | Array<StorefrontAPI.SelectedOptionInput>
    | StorefrontAPI.SelectedOptionInput;
}>;

export type ProductQuery = {
  product?: StorefrontAPI.Maybe<
    Pick<
      StorefrontAPI.Product,
      | "id"
      | "title"
      | "vendor"
      | "handle"
      | "descriptionHtml"
      | "description"
      | "tags"
      | "encodedVariantExistence"
      | "encodedVariantAvailability"
      | "requiresSellingPlan"
    > & {
      sizeChart?: StorefrontAPI.Maybe<Pick<StorefrontAPI.Metafield, "value">>;
      collections: {
        nodes: Array<Pick<StorefrontAPI.Collection, "handle" | "title">>;
      };
      images: {
        nodes: Array<
          Pick<
            StorefrontAPI.Image,
            "id" | "url" | "altText" | "width" | "height"
          >
        >;
      };
      media: {
        nodes: Array<
          | { __typename: "ExternalVideo" | "Model3d" }
          | ({ __typename: "MediaImage" } & Pick<
              StorefrontAPI.MediaImage,
              "id" | "alt"
            > & {
                image?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    "id" | "url" | "altText" | "width" | "height"
                  >
                >;
              })
          | ({ __typename: "Video" } & Pick<
              StorefrontAPI.Video,
              "id" | "alt"
            > & {
                sources: Array<
                  Pick<StorefrontAPI.VideoSource, "url" | "mimeType">
                >;
                previewImage?: StorefrontAPI.Maybe<
                  Pick<
                    StorefrontAPI.Image,
                    "url" | "altText" | "width" | "height"
                  >
                >;
              })
        >;
      };
      variants: {
        nodes: Array<
          Pick<StorefrontAPI.ProductVariant, "id" | "availableForSale"> & {
            price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
            compareAtPrice?: StorefrontAPI.Maybe<
              Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
            >;
          }
        >;
      };
      options: Array<
        Pick<StorefrontAPI.ProductOption, "name"> & {
          optionValues: Array<
            Pick<StorefrontAPI.ProductOptionValue, "name"> & {
              firstSelectableVariant?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.ProductVariant,
                  | "availableForSale"
                  | "quantityAvailable"
                  | "id"
                  | "sku"
                  | "title"
                > & {
                  compareAtPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                  >;
                  image?: StorefrontAPI.Maybe<
                    { __typename: "Image" } & Pick<
                      StorefrontAPI.Image,
                      "id" | "url" | "altText" | "width" | "height"
                    >
                  >;
                  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                  product: Pick<StorefrontAPI.Product, "title" | "handle">;
                  selectedOptions: Array<
                    Pick<StorefrontAPI.SelectedOption, "name" | "value">
                  >;
                  unitPrice?: StorefrontAPI.Maybe<
                    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                  >;
                  sellingPlanAllocations: {
                    nodes: Array<{
                      sellingPlan: Pick<
                        StorefrontAPI.SellingPlan,
                        "id" | "name"
                      > & {
                        options: Array<
                          Pick<
                            StorefrontAPI.SellingPlanOption,
                            "name" | "value"
                          >
                        >;
                        priceAdjustments: Array<{
                          adjustmentValue:
                            | ({
                                __typename: "SellingPlanFixedAmountPriceAdjustment";
                              } & {
                                adjustmentAmount: Pick<
                                  StorefrontAPI.MoneyV2,
                                  "amount" | "currencyCode"
                                >;
                              })
                            | ({
                                __typename: "SellingPlanFixedPriceAdjustment";
                              } & {
                                price: Pick<
                                  StorefrontAPI.MoneyV2,
                                  "amount" | "currencyCode"
                                >;
                              })
                            | ({
                                __typename: "SellingPlanPercentagePriceAdjustment";
                              } & Pick<
                                StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                                "adjustmentPercentage"
                              >);
                        }>;
                      };
                      priceAdjustments: Array<{
                        price: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                        compareAtPrice: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                        perDeliveryPrice: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                      }>;
                    }>;
                  };
                }
              >;
              swatch?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.ProductOptionValueSwatch, "color"> & {
                  image?: StorefrontAPI.Maybe<{
                    previewImage?: StorefrontAPI.Maybe<
                      Pick<StorefrontAPI.Image, "url">
                    >;
                  }>;
                }
              >;
            }
          >;
        }
      >;
      selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
        Pick<
          StorefrontAPI.ProductVariant,
          "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
        > & {
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
          image?: StorefrontAPI.Maybe<
            { __typename: "Image" } & Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
          product: Pick<StorefrontAPI.Product, "title" | "handle">;
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, "name" | "value">
          >;
          unitPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
          sellingPlanAllocations: {
            nodes: Array<{
              sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
                options: Array<
                  Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
                >;
                priceAdjustments: Array<{
                  adjustmentValue:
                    | ({
                        __typename: "SellingPlanFixedAmountPriceAdjustment";
                      } & {
                        adjustmentAmount: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                      })
                    | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                        price: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                      })
                    | ({
                        __typename: "SellingPlanPercentagePriceAdjustment";
                      } & Pick<
                        StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                        "adjustmentPercentage"
                      >);
                }>;
              };
              priceAdjustments: Array<{
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                perDeliveryPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              }>;
            }>;
          };
        }
      >;
      adjacentVariants: Array<
        Pick<
          StorefrontAPI.ProductVariant,
          "availableForSale" | "quantityAvailable" | "id" | "sku" | "title"
        > & {
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
          image?: StorefrontAPI.Maybe<
            { __typename: "Image" } & Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
          product: Pick<StorefrontAPI.Product, "title" | "handle">;
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, "name" | "value">
          >;
          unitPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
          sellingPlanAllocations: {
            nodes: Array<{
              sellingPlan: Pick<StorefrontAPI.SellingPlan, "id" | "name"> & {
                options: Array<
                  Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
                >;
                priceAdjustments: Array<{
                  adjustmentValue:
                    | ({
                        __typename: "SellingPlanFixedAmountPriceAdjustment";
                      } & {
                        adjustmentAmount: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                      })
                    | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                        price: Pick<
                          StorefrontAPI.MoneyV2,
                          "amount" | "currencyCode"
                        >;
                      })
                    | ({
                        __typename: "SellingPlanPercentagePriceAdjustment";
                      } & Pick<
                        StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                        "adjustmentPercentage"
                      >);
                }>;
              };
              priceAdjustments: Array<{
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
                perDeliveryPrice: Pick<
                  StorefrontAPI.MoneyV2,
                  "amount" | "currencyCode"
                >;
              }>;
            }>;
          };
        }
      >;
      seo: Pick<StorefrontAPI.Seo, "description" | "title">;
      sellingPlanGroups: {
        nodes: Array<
          Pick<StorefrontAPI.SellingPlanGroup, "name" | "appName"> & {
            options: Array<
              Pick<StorefrontAPI.SellingPlanGroupOption, "name" | "values">
            >;
            sellingPlans: {
              nodes: Array<
                Pick<
                  StorefrontAPI.SellingPlan,
                  "id" | "name" | "description" | "recurringDeliveries"
                > & {
                  options: Array<
                    Pick<StorefrontAPI.SellingPlanOption, "name" | "value">
                  >;
                  priceAdjustments: Array<{
                    adjustmentValue:
                      | ({
                          __typename: "SellingPlanFixedAmountPriceAdjustment";
                        } & {
                          adjustmentAmount: Pick<
                            StorefrontAPI.MoneyV2,
                            "amount" | "currencyCode"
                          >;
                        })
                      | ({ __typename: "SellingPlanFixedPriceAdjustment" } & {
                          price: Pick<
                            StorefrontAPI.MoneyV2,
                            "amount" | "currencyCode"
                          >;
                        })
                      | ({
                          __typename: "SellingPlanPercentagePriceAdjustment";
                        } & Pick<
                          StorefrontAPI.SellingPlanPercentagePriceAdjustment,
                          "adjustmentPercentage"
                        >);
                  }>;
                }
              >;
            };
          }
        >;
      };
    }
  >;
};

export type SidebarCollectionsProductQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SidebarCollectionsProductQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
      }
    >;
  };
  allProducts: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "id" | "availableForSale"> & {
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
  };
};

export type RecommendedProductFragment = Pick<
  StorefrontAPI.Product,
  "id" | "handle" | "title" | "availableForSale" | "tags"
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "altText" | "url" | "width" | "height">
  >;
  images: {
    nodes: Array<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
  };
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  variants: {
    nodes: Array<
      Pick<
        StorefrontAPI.ProductVariant,
        "id" | "title" | "availableForSale"
      > & {
        selectedOptions: Array<
          Pick<StorefrontAPI.SelectedOption, "name" | "value">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
};

export type ProductPageRecommendationsQueryVariables = StorefrontAPI.Exact<{
  productId: StorefrontAPI.Scalars["ID"]["input"];
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type ProductPageRecommendationsQuery = {
  productRecommendations?: StorefrontAPI.Maybe<
    Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "handle" | "title" | "availableForSale" | "tags"
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "altText" | "url" | "width" | "height"
          >
        >;
        images: {
          nodes: Array<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
        };
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        variants: {
          nodes: Array<
            Pick<
              StorefrontAPI.ProductVariant,
              "id" | "title" | "availableForSale"
            > & {
              selectedOptions: Array<
                Pick<StorefrontAPI.SelectedOption, "name" | "value">
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >
  >;
};

export type DiscountVariantFragment = Pick<
  StorefrontAPI.ProductVariant,
  "id" | "availableForSale"
> & {
  price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  compareAtPrice?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
  >;
};

export type DiscountProductFragment = Pick<
  StorefrontAPI.Product,
  "id" | "handle" | "title" | "availableForSale"
> & {
  featuredImage?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, "id" | "altText" | "url" | "width" | "height">
  >;
  priceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  compareAtPriceRange: {
    minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
  };
  variants: {
    nodes: Array<
      Pick<StorefrontAPI.ProductVariant, "id" | "availableForSale"> & {
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };
};

export type DiscountsPageQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  first?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  last?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["Int"]["input"]>;
  startCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  endCursor?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
}>;

export type DiscountsPageQuery = {
  products: {
    nodes: Array<
      Pick<
        StorefrontAPI.Product,
        "id" | "handle" | "title" | "availableForSale"
      > & {
        featuredImage?: StorefrontAPI.Maybe<
          Pick<
            StorefrontAPI.Image,
            "id" | "altText" | "url" | "width" | "height"
          >
        >;
        priceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
          maxVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        compareAtPriceRange: {
          minVariantPrice: Pick<
            StorefrontAPI.MoneyV2,
            "amount" | "currencyCode"
          >;
        };
        variants: {
          nodes: Array<
            Pick<StorefrontAPI.ProductVariant, "id" | "availableForSale"> & {
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        };
      }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
  };
};

export type SidebarCollectionsForDiscountsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
}>;

export type SidebarCollectionsForDiscountsQuery = {
  collections: {
    nodes: Array<
      Pick<StorefrontAPI.Collection, "id" | "handle" | "title"> & {
        products: { nodes: Array<Pick<StorefrontAPI.Product, "id">> };
      }
    >;
  };
  allProducts: {
    nodes: Array<
      Pick<StorefrontAPI.Product, "id" | "availableForSale"> & {
        variants: {
          nodes: Array<Pick<StorefrontAPI.ProductVariant, "availableForSale">>;
        };
      }
    >;
  };
};

export type SearchProductFragment = { __typename: "Product" } & Pick<
  StorefrontAPI.Product,
  "handle" | "id" | "title" | "trackingParameters" | "availableForSale"
> & {
    featuredImage?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "altText" | "url" | "width" | "height">
    >;
    images: {
      nodes: Array<
        Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
      >;
    };
    priceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    compareAtPriceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    variants: {
      nodes: Array<
        Pick<
          StorefrontAPI.ProductVariant,
          "id" | "title" | "availableForSale"
        > & {
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, "name" | "value">
          >;
          price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
        }
      >;
    };
  };

export type SearchPageFragment = { __typename: "Page" } & Pick<
  StorefrontAPI.Page,
  "handle" | "id" | "title" | "trackingParameters"
>;

export type SearchArticleFragment = { __typename: "Article" } & Pick<
  StorefrontAPI.Article,
  "handle" | "id" | "title" | "trackingParameters" | "excerpt" | "publishedAt"
> & {
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
  };

export type PageInfoFragmentFragment = Pick<
  StorefrontAPI.PageInfo,
  "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
>;

export type SearchCollectionFragment = { __typename: "Collection" } & Pick<
  StorefrontAPI.Collection,
  "id" | "handle" | "title" | "description"
> & {
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    products: {
      nodes: Array<Pick<StorefrontAPI.Product, "id" | "availableForSale">>;
    };
  };

export type SearchCollectionsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  query: StorefrontAPI.Scalars["String"]["input"];
  first: StorefrontAPI.Scalars["Int"]["input"];
}>;

export type SearchCollectionsQuery = {
  collections: Pick<StorefrontAPI.CollectionConnection, "totalCount"> & {
    nodes: Array<
      { __typename: "Collection" } & Pick<
        StorefrontAPI.Collection,
        "id" | "handle" | "title" | "description"
      > & {
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          products: {
            nodes: Array<
              Pick<StorefrontAPI.Product, "id" | "availableForSale">
            >;
          };
        }
    >;
  };
};

export type RegularSearchQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  term: StorefrontAPI.Scalars["String"]["input"];
  productFirst: StorefrontAPI.Scalars["Int"]["input"];
  productAfter?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
  articleFirst: StorefrontAPI.Scalars["Int"]["input"];
  articleAfter?: StorefrontAPI.InputMaybe<
    StorefrontAPI.Scalars["String"]["input"]
  >;
}>;

export type RegularSearchQuery = {
  products: Pick<StorefrontAPI.SearchResultItemConnection, "totalCount"> & {
    nodes: Array<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "handle" | "id" | "title" | "trackingParameters" | "availableForSale"
      > & {
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "altText" | "url" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
  };
  articles: Pick<StorefrontAPI.SearchResultItemConnection, "totalCount"> & {
    nodes: Array<
      { __typename: "Article" } & Pick<
        StorefrontAPI.Article,
        | "handle"
        | "id"
        | "title"
        | "trackingParameters"
        | "excerpt"
        | "publishedAt"
      > & {
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
        }
    >;
    pageInfo: Pick<
      StorefrontAPI.PageInfo,
      "hasNextPage" | "hasPreviousPage" | "startCursor" | "endCursor"
    >;
  };
};

export type SearchProductsQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  term: StorefrontAPI.Scalars["String"]["input"];
  first: StorefrontAPI.Scalars["Int"]["input"];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["String"]["input"]>;
}>;

export type SearchProductsQuery = {
  products: {
    nodes: Array<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "handle" | "id" | "title" | "trackingParameters" | "availableForSale"
      > & {
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "altText" | "url" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >;
    pageInfo: Pick<StorefrontAPI.PageInfo, "hasNextPage" | "endCursor">;
  };
};

export type SearchArticlesQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  term: StorefrontAPI.Scalars["String"]["input"];
  first: StorefrontAPI.Scalars["Int"]["input"];
  after?: StorefrontAPI.InputMaybe<StorefrontAPI.Scalars["String"]["input"]>;
}>;

export type SearchArticlesQuery = {
  articles: {
    nodes: Array<
      { __typename: "Article" } & Pick<
        StorefrontAPI.Article,
        | "handle"
        | "id"
        | "title"
        | "trackingParameters"
        | "excerpt"
        | "publishedAt"
      > & {
          image?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          blog: Pick<StorefrontAPI.Blog, "handle" | "title">;
        }
    >;
    pageInfo: Pick<StorefrontAPI.PageInfo, "hasNextPage" | "endCursor">;
  };
};

export type PredictiveArticleFragment = { __typename: "Article" } & Pick<
  StorefrontAPI.Article,
  "id" | "title" | "handle" | "trackingParameters"
> & {
    blog: Pick<StorefrontAPI.Blog, "handle">;
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
    >;
  };

export type PredictiveCollectionFragment = { __typename: "Collection" } & Pick<
  StorefrontAPI.Collection,
  "id" | "title" | "handle" | "trackingParameters"
> & {
    image?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
    >;
    products: {
      nodes: Array<Pick<StorefrontAPI.Product, "id" | "availableForSale">>;
    };
  };

export type PredictivePageFragment = { __typename: "Page" } & Pick<
  StorefrontAPI.Page,
  "id" | "title" | "handle" | "trackingParameters"
>;

export type PredictiveProductFragment = { __typename: "Product" } & Pick<
  StorefrontAPI.Product,
  "id" | "title" | "handle" | "availableForSale" | "trackingParameters"
> & {
    selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.ProductVariant, "id"> & {
        image?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
        >;
        price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
        compareAtPrice?: StorefrontAPI.Maybe<
          Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
        >;
      }
    >;
  };

export type PredictiveQueryFragment = {
  __typename: "SearchQuerySuggestion";
} & Pick<
  StorefrontAPI.SearchQuerySuggestion,
  "text" | "styledText" | "trackingParameters"
>;

export type PredictiveSearchQueryVariables = StorefrontAPI.Exact<{
  country?: StorefrontAPI.InputMaybe<StorefrontAPI.CountryCode>;
  language?: StorefrontAPI.InputMaybe<StorefrontAPI.LanguageCode>;
  limit: StorefrontAPI.Scalars["Int"]["input"];
  limitScope: StorefrontAPI.PredictiveSearchLimitScope;
  term: StorefrontAPI.Scalars["String"]["input"];
  types?: StorefrontAPI.InputMaybe<
    | Array<StorefrontAPI.PredictiveSearchType>
    | StorefrontAPI.PredictiveSearchType
  >;
}>;

export type PredictiveSearchQuery = {
  predictiveSearch?: StorefrontAPI.Maybe<{
    articles: Array<
      { __typename: "Article" } & Pick<
        StorefrontAPI.Article,
        "id" | "title" | "handle" | "trackingParameters"
      > & {
          blog: Pick<StorefrontAPI.Blog, "handle">;
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
        }
    >;
    collections: Array<
      { __typename: "Collection" } & Pick<
        StorefrontAPI.Collection,
        "id" | "title" | "handle" | "trackingParameters"
      > & {
          image?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.Image, "url" | "altText" | "width" | "height">
          >;
          products: {
            nodes: Array<
              Pick<StorefrontAPI.Product, "id" | "availableForSale">
            >;
          };
        }
    >;
    pages: Array<
      { __typename: "Page" } & Pick<
        StorefrontAPI.Page,
        "id" | "title" | "handle" | "trackingParameters"
      >
    >;
    products: Array<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale" | "trackingParameters"
      > & {
          selectedOrFirstAvailableVariant?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.ProductVariant, "id"> & {
              image?: StorefrontAPI.Maybe<
                Pick<
                  StorefrontAPI.Image,
                  "url" | "altText" | "width" | "height"
                >
              >;
              price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
              compareAtPrice?: StorefrontAPI.Maybe<
                Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
              >;
            }
          >;
        }
    >;
    queries: Array<
      { __typename: "SearchQuerySuggestion" } & Pick<
        StorefrontAPI.SearchQuerySuggestion,
        "text" | "styledText" | "trackingParameters"
      >
    >;
  }>;
};

export type SharedWishlistProductFragment = { __typename: "Product" } & Pick<
  StorefrontAPI.Product,
  "id" | "title" | "handle" | "availableForSale"
> & {
    featuredImage?: StorefrontAPI.Maybe<
      Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
    >;
    images: {
      nodes: Array<
        Pick<StorefrontAPI.Image, "id" | "url" | "altText" | "width" | "height">
      >;
    };
    priceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
      maxVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    compareAtPriceRange: {
      minVariantPrice: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
    };
    variants: {
      nodes: Array<
        Pick<
          StorefrontAPI.ProductVariant,
          "id" | "title" | "availableForSale"
        > & {
          selectedOptions: Array<
            Pick<StorefrontAPI.SelectedOption, "name" | "value">
          >;
          price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
          compareAtPrice?: StorefrontAPI.Maybe<
            Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
          >;
        }
      >;
    };
  };

export type SharedWishlistProductsQueryVariables = StorefrontAPI.Exact<{
  ids:
    | Array<StorefrontAPI.Scalars["ID"]["input"]>
    | StorefrontAPI.Scalars["ID"]["input"];
}>;

export type SharedWishlistProductsQuery = {
  nodes: Array<
    StorefrontAPI.Maybe<
      { __typename: "Product" } & Pick<
        StorefrontAPI.Product,
        "id" | "title" | "handle" | "availableForSale"
      > & {
          featuredImage?: StorefrontAPI.Maybe<
            Pick<
              StorefrontAPI.Image,
              "id" | "url" | "altText" | "width" | "height"
            >
          >;
          images: {
            nodes: Array<
              Pick<
                StorefrontAPI.Image,
                "id" | "url" | "altText" | "width" | "height"
              >
            >;
          };
          priceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
            maxVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          compareAtPriceRange: {
            minVariantPrice: Pick<
              StorefrontAPI.MoneyV2,
              "amount" | "currencyCode"
            >;
          };
          variants: {
            nodes: Array<
              Pick<
                StorefrontAPI.ProductVariant,
                "id" | "title" | "availableForSale"
              > & {
                selectedOptions: Array<
                  Pick<StorefrontAPI.SelectedOption, "name" | "value">
                >;
                price: Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">;
                compareAtPrice?: StorefrontAPI.Maybe<
                  Pick<StorefrontAPI.MoneyV2, "amount" | "currencyCode">
                >;
              }
            >;
          };
        }
    >
  >;
};

interface GeneratedQueryTypes {
  "#graphql\n  fragment Shop on Shop {\n    id\n    name\n    description\n    primaryDomain {\n      url\n    }\n    brand {\n      logo {\n        image {\n          url\n        }\n      }\n    }\n  }\n  query Header(\n    $country: CountryCode\n    $headerMenuHandle: String!\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      ...Shop\n    }\n    menu(handle: $headerMenuHandle) {\n      ...Menu\n    }\n  }\n  #graphql\n  fragment MenuItem on MenuItem {\n    id\n    resourceId\n    tags\n    title\n    type\n    url\n  }\n  fragment ChildMenuItem on MenuItem {\n    ...MenuItem\n  }\n  fragment ParentMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...ChildMenuItem\n    }\n  }\n  fragment Menu on Menu {\n    id\n    items {\n      ...ParentMenuItem\n    }\n  }\n\n": {
    return: HeaderQuery;
    variables: HeaderQueryVariables;
  };
  "#graphql\n  query Footer(\n    $country: CountryCode\n    $footerMenuHandle: String!\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    menu(handle: $footerMenuHandle) {\n      ...Menu\n    }\n  }\n  #graphql\n  fragment MenuItem on MenuItem {\n    id\n    resourceId\n    tags\n    title\n    type\n    url\n  }\n  fragment ChildMenuItem on MenuItem {\n    ...MenuItem\n  }\n  fragment ParentMenuItem on MenuItem {\n    ...MenuItem\n    items {\n      ...ChildMenuItem\n    }\n  }\n  fragment Menu on Menu {\n    id\n    items {\n      ...ParentMenuItem\n    }\n  }\n\n": {
    return: FooterQuery;
    variables: FooterQueryVariables;
  };
  "#graphql\n  query MenuCollections(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    collections(first: 50, sortKey: TITLE) {\n      nodes {\n        id\n        handle\n        title\n        image {\n          id\n          url\n          altText\n          width\n          height\n        }\n        products(first: 250) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n    allProducts: products(first: 250) {\n      pageInfo {\n        hasNextPage\n      }\n      nodes {\n        id\n        title\n        productType\n        availableForSale\n        variants(first: 10) {\n          nodes {\n            availableForSale\n            price {\n              amount\n            }\n            compareAtPrice {\n              amount\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: MenuCollectionsQuery;
    variables: MenuCollectionsQueryVariables;
  };
  "#graphql\n    query ProductExists($handle: String!) {\n        product(handle: $handle) {\n            id\n        }\n    }\n": {
    return: ProductExistsQuery;
    variables: ProductExistsQueryVariables;
  };
  '#graphql\n  query SiteContent(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {\n      ...SiteSettings\n    }\n  }\n  #graphql\n  fragment SiteSettings on Metaobject {\n    id\n    handle\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # BRAND IDENTITY\n    # ─────────────────────────────────────────────────────────────────────────\n    brandName: field(key: "brand_name") { value }\n    # List of single line text - Shopify returns JSON array of strings\n    brandWords: field(key: "words_to_describe_your_brand") { value }\n    missionStatement: field(key: "brand_mission") { value }\n    brandLogo: field(key: "brand_logo") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # HERO SECTION\n    # ─────────────────────────────────────────────────────────────────────────\n    heroHeading: field(key: "hero_main_heading") { value }\n    heroDescription: field(key: "hero_description_text") { value }\n    featuredProductSection: field(key: "featured_product_section") {\n      reference {\n        ... on Product {\n          __typename\n          id\n          handle\n          title\n          vendor\n          description\n          availableForSale\n          featuredImage {\n            url\n            altText\n            width\n            height\n          }\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n            maxVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          compareAtPriceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          tags\n          selectedOrFirstAvailableVariant(\n            selectedOptions: []\n            ignoreUnknownOptions: true\n            caseInsensitiveMatch: true\n          ) {\n            id\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n            image {\n              url\n              altText\n              width\n              height\n            }\n          }\n          variants(first: 100) {\n            nodes {\n              id\n              title\n              availableForSale\n              selectedOptions {\n                name\n                value\n              }\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n            }\n          }\n        }\n      }\n    }\n    heroMediaMobile: field(key: "hero_background_media_mobile") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n    heroMediaLargeScreen: field(key: "hero_background_media_large_screen") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # SEO DEFAULTS\n    # ─────────────────────────────────────────────────────────────────────────\n    siteUrl: field(key: "website_url") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # CONTACT INFORMATION\n    # ─────────────────────────────────────────────────────────────────────────\n    contactEmail: field(key: "contact_email") { value }\n    contactPhone: field(key: "contact_phone") { value }\n    businessHours: field(key: "business_hours") { value }\n    streetAddress: field(key: "street_address") { value }\n    city: field(key: "city") { value }\n    state: field(key: "state_province") { value }\n    zipCode: field(key: "postal_code") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # SECTION HEADINGS\n    # ─────────────────────────────────────────────────────────────────────────\n    blogSectionTitle: field(key: "blog_section_heading") { value }\n    collectionsTitle: field(key: "collections_section_heading") { value }\n    relatedProductsTitle: field(key: "related_products_heading") { value }\n    recommendedTitle: field(key: "recommended_products_heading") { value }\n    instagramTitle: field(key: "instagram_section_heading") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PAGE HEADINGS (Gallery & Blog)\n    # ─────────────────────────────────────────────────────────────────────────\n    galleryPageHeading: field(key: "gallery_page_heading") { value }\n    galleryPageDescription: field(key: "gallery_page_description") { value }\n    blogPageHeading: field(key: "blog_page_heading") { value }\n    blogPageDescription: field(key: "blog_page_description") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PROMOTIONAL BANNERS\n    # ─────────────────────────────────────────────────────────────────────────\n    # announcement_banner_text is now a "List of single line text" field in Shopify\n    # Returns JSON array of strings: ["text1", "text2", ...]\n    announcementBanner: field(key: "announcement_banner_text") { value }\n    promotionalBannerOneMedia: field(key: "promotional_banner_one_media") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n    promotionalBannerTwoMedia: field(key: "promotional_banner_two_media") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # COLLECTIONS\n    # ─────────────────────────────────────────────────────────────────────────\n\n    # Messenger Page ID for Facebook Customer Chat plugin\n    messengerId: field(key: "messenger_page_id") { value }\n\n    # WhatsApp phone number (digits only, or international format)\n    whatsappNumber: field(key: "whatsapp_number") { value }\n\n    # List of links field - Shopify returns [{text, url}, ...] where text is the platform name\n    socialLinksData: field(key: "social_links_data") { value }\n\n    # JSON array: [{customerName, location, rating, text, avatarUrl}, ...]\n    testimonialsData: field(key: "testimonials_data") { value }\n\n    # JSON array: [{question, answer}, ...]\n    faqItemsData: field(key: "faq_items_data") { value }\n\n    # List of file references (images/videos)\n    instagramMediaData: field(key: "instagram_images_data") {\n      references(first: 20) {\n        nodes {\n          ... on MediaImage {\n            __typename\n            id\n            image {\n              url\n              altText\n              width\n              height\n            }\n          }\n          ... on Video {\n            __typename\n            id\n            sources {\n              url\n              mimeType\n            }\n            previewImage {\n              url\n              altText\n            }\n            alt\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # FAVICON (File reference - MediaImage only)\n    # Dynamic favicon served from /favicon.ico route\n    # ─────────────────────────────────────────────────────────────────────────\n    favicon: field(key: "favicon") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PWA ICONS (File references - MediaImage only)\n    # Required for Progressive Web App installability\n    # ─────────────────────────────────────────────────────────────────────────\n    icon192: field(key: "icon_192") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n    icon512: field(key: "icon_512") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n    icon180Apple: field(key: "icon_180_apple") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n  }\n\n': {
    return: SiteContentQuery;
    variables: SiteContentQueryVariables;
  };
  '#graphql\n  query ThemeSettings(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {\n      ...ThemeSettings\n    }\n  }\n  #graphql\n  fragment ThemeSettings on Metaobject {\n    id\n    handle\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # FONTS (Google Font family names)\n    # These semantic names map to CSS variable roles:\n    # - body_font → --font-sans (paragraphs, buttons, labels, UI text)\n    # - heading_font → --font-serif (h1-h6, hero text, section titles)\n    # - price_font → --font-mono (prices, quantities, codes, tabular data)\n    # ─────────────────────────────────────────────────────────────────────────\n    fontBody: field(key: "body_font") { value }\n    fontHeading: field(key: "heading_font") { value }\n    fontPrice: field(key: "price_font") { value }\n    borderRadius: field(key: "border_radius") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # COLORS (OKLCH or HEX format)\n    # 5 core colors that derive 25+ CSS variables via theme-utils.ts\n    # ─────────────────────────────────────────────────────────────────────────\n    colorPrimary: field(key: "color_primary") { value }\n    colorSecondary: field(key: "color_secondary") { value }\n    colorBackground: field(key: "color_background") { value }\n    colorForeground: field(key: "color_foreground") { value }\n    colorAccent: field(key: "color_accent") { value }\n  }\n\n': {
    return: ThemeSettingsQuery;
    variables: ThemeSettingsQueryVariables;
  };
  '#graphql\n  query PwaManifest(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    # Site settings for brand identity and PWA icons\n    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {\n      ...SiteSettings\n    }\n    # Theme settings for colors (converted to HEX for manifest)\n    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {\n      ...ThemeSettings\n    }\n  }\n  #graphql\n  fragment SiteSettings on Metaobject {\n    id\n    handle\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # BRAND IDENTITY\n    # ─────────────────────────────────────────────────────────────────────────\n    brandName: field(key: "brand_name") { value }\n    # List of single line text - Shopify returns JSON array of strings\n    brandWords: field(key: "words_to_describe_your_brand") { value }\n    missionStatement: field(key: "brand_mission") { value }\n    brandLogo: field(key: "brand_logo") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # HERO SECTION\n    # ─────────────────────────────────────────────────────────────────────────\n    heroHeading: field(key: "hero_main_heading") { value }\n    heroDescription: field(key: "hero_description_text") { value }\n    featuredProductSection: field(key: "featured_product_section") {\n      reference {\n        ... on Product {\n          __typename\n          id\n          handle\n          title\n          vendor\n          description\n          availableForSale\n          featuredImage {\n            url\n            altText\n            width\n            height\n          }\n          priceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n            maxVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          compareAtPriceRange {\n            minVariantPrice {\n              amount\n              currencyCode\n            }\n          }\n          tags\n          selectedOrFirstAvailableVariant(\n            selectedOptions: []\n            ignoreUnknownOptions: true\n            caseInsensitiveMatch: true\n          ) {\n            id\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n            image {\n              url\n              altText\n              width\n              height\n            }\n          }\n          variants(first: 100) {\n            nodes {\n              id\n              title\n              availableForSale\n              selectedOptions {\n                name\n                value\n              }\n              price {\n                amount\n                currencyCode\n              }\n              compareAtPrice {\n                amount\n                currencyCode\n              }\n            }\n          }\n        }\n      }\n    }\n    heroMediaMobile: field(key: "hero_background_media_mobile") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n    heroMediaLargeScreen: field(key: "hero_background_media_large_screen") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # SEO DEFAULTS\n    # ─────────────────────────────────────────────────────────────────────────\n    siteUrl: field(key: "website_url") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # CONTACT INFORMATION\n    # ─────────────────────────────────────────────────────────────────────────\n    contactEmail: field(key: "contact_email") { value }\n    contactPhone: field(key: "contact_phone") { value }\n    businessHours: field(key: "business_hours") { value }\n    streetAddress: field(key: "street_address") { value }\n    city: field(key: "city") { value }\n    state: field(key: "state_province") { value }\n    zipCode: field(key: "postal_code") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # SECTION HEADINGS\n    # ─────────────────────────────────────────────────────────────────────────\n    blogSectionTitle: field(key: "blog_section_heading") { value }\n    collectionsTitle: field(key: "collections_section_heading") { value }\n    relatedProductsTitle: field(key: "related_products_heading") { value }\n    recommendedTitle: field(key: "recommended_products_heading") { value }\n    instagramTitle: field(key: "instagram_section_heading") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PAGE HEADINGS (Gallery & Blog)\n    # ─────────────────────────────────────────────────────────────────────────\n    galleryPageHeading: field(key: "gallery_page_heading") { value }\n    galleryPageDescription: field(key: "gallery_page_description") { value }\n    blogPageHeading: field(key: "blog_page_heading") { value }\n    blogPageDescription: field(key: "blog_page_description") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PROMOTIONAL BANNERS\n    # ─────────────────────────────────────────────────────────────────────────\n    # announcement_banner_text is now a "List of single line text" field in Shopify\n    # Returns JSON array of strings: ["text1", "text2", ...]\n    announcementBanner: field(key: "announcement_banner_text") { value }\n    promotionalBannerOneMedia: field(key: "promotional_banner_one_media") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n    promotionalBannerTwoMedia: field(key: "promotional_banner_two_media") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          __typename\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n          }\n          alt\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # COLLECTIONS\n    # ─────────────────────────────────────────────────────────────────────────\n\n    # Messenger Page ID for Facebook Customer Chat plugin\n    messengerId: field(key: "messenger_page_id") { value }\n\n    # WhatsApp phone number (digits only, or international format)\n    whatsappNumber: field(key: "whatsapp_number") { value }\n\n    # List of links field - Shopify returns [{text, url}, ...] where text is the platform name\n    socialLinksData: field(key: "social_links_data") { value }\n\n    # JSON array: [{customerName, location, rating, text, avatarUrl}, ...]\n    testimonialsData: field(key: "testimonials_data") { value }\n\n    # JSON array: [{question, answer}, ...]\n    faqItemsData: field(key: "faq_items_data") { value }\n\n    # List of file references (images/videos)\n    instagramMediaData: field(key: "instagram_images_data") {\n      references(first: 20) {\n        nodes {\n          ... on MediaImage {\n            __typename\n            id\n            image {\n              url\n              altText\n              width\n              height\n            }\n          }\n          ... on Video {\n            __typename\n            id\n            sources {\n              url\n              mimeType\n            }\n            previewImage {\n              url\n              altText\n            }\n            alt\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # FAVICON (File reference - MediaImage only)\n    # Dynamic favicon served from /favicon.ico route\n    # ─────────────────────────────────────────────────────────────────────────\n    favicon: field(key: "favicon") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n          }\n        }\n      }\n    }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # PWA ICONS (File references - MediaImage only)\n    # Required for Progressive Web App installability\n    # ─────────────────────────────────────────────────────────────────────────\n    icon192: field(key: "icon_192") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n    icon512: field(key: "icon_512") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n    icon180Apple: field(key: "icon_180_apple") {\n      reference {\n        ... on MediaImage {\n          __typename\n          image {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment ThemeSettings on Metaobject {\n    id\n    handle\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # FONTS (Google Font family names)\n    # These semantic names map to CSS variable roles:\n    # - body_font → --font-sans (paragraphs, buttons, labels, UI text)\n    # - heading_font → --font-serif (h1-h6, hero text, section titles)\n    # - price_font → --font-mono (prices, quantities, codes, tabular data)\n    # ─────────────────────────────────────────────────────────────────────────\n    fontBody: field(key: "body_font") { value }\n    fontHeading: field(key: "heading_font") { value }\n    fontPrice: field(key: "price_font") { value }\n    borderRadius: field(key: "border_radius") { value }\n\n    # ─────────────────────────────────────────────────────────────────────────\n    # COLORS (OKLCH or HEX format)\n    # 5 core colors that derive 25+ CSS variables via theme-utils.ts\n    # ─────────────────────────────────────────────────────────────────────────\n    colorPrimary: field(key: "color_primary") { value }\n    colorSecondary: field(key: "color_secondary") { value }\n    colorBackground: field(key: "color_background") { value }\n    colorForeground: field(key: "color_foreground") { value }\n    colorAccent: field(key: "color_accent") { value }\n  }\n\n': {
    return: PwaManifestQuery;
    variables: PwaManifestQueryVariables;
  };
  '#graphql\n  fragment CartSuggestionProduct on Product {\n    id\n    title\n    handle\n    availableForSale\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    featuredImage {\n      id\n      url\n      altText\n      width\n      height\n    }\n    variants(first: 1) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n  query CartSuggestions(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    products(first: 16, sortKey: BEST_SELLING, query: "available_for_sale:true") {\n      nodes {\n        ...CartSuggestionProduct\n      }\n    }\n  }\n': {
    return: CartSuggestionsQuery;
    variables: CartSuggestionsQueryVariables;
  };
  '#graphql\n  query ShopShippingConfig(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    shop {\n      freeShippingThreshold: metafield(namespace: "custom", key: "free_shipping_threshold") {\n        value\n        type\n      }\n      paymentSettings {\n        currencyCode\n      }\n    }\n  }\n': {
    return: ShopShippingConfigQuery;
    variables: ShopShippingConfigQueryVariables;
  };
  "#graphql\n  query HasBlog(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    articles(first: 1) {\n      nodes {\n        id\n      }\n    }\n  }\n": {
    return: HasBlogQuery;
    variables: HasBlogQueryVariables;
  };
  "#graphql\n  query StoreRobots($country: CountryCode, $language: LanguageCode)\n   @inContext(country: $country, language: $language) {\n    shop {\n      id\n    }\n  }\n": {
    return: StoreRobotsQuery;
    variables: StoreRobotsQueryVariables;
  };
  "#graphql\n  fragment CuratedProduct on Product {\n    id\n    title\n    handle\n    availableForSale\n    tags\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    featuredImage {\n      id\n      url\n      altText\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n  query CuratedCollections($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    collections(first: 20) {\n      nodes {\n        id\n        handle\n        title\n        products(first: 6, filters: [{available: true}]) {\n          nodes {\n            ...CuratedProduct\n          }\n        }\n      }\n    }\n  }\n": {
    return: CuratedCollectionsQuery;
    variables: CuratedCollectionsQueryVariables;
  };
  "#graphql\n  query HomeRecentlyViewedProducts(\n    $ids: [ID!]!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Product {\n        __typename\n        id\n        title\n        handle\n        availableForSale\n        tags\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n          maxVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: HomeRecentlyViewedProductsQuery;
    variables: HomeRecentlyViewedProductsQueryVariables;
  };
  '#graphql\n  query AllProducts(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    products(first: 250, query: "available_for_sale:true") {\n      nodes {\n        id\n        title\n        handle\n        availableForSale\n        tags\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n          maxVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: AllProductsQuery;
    variables: AllProductsQueryVariables;
  };
  "#graphql\n  fragment HeroCollection on Collection {\n    id\n    handle\n    title\n    description\n    image {\n      url\n      altText\n      width\n      height\n    }\n  }\n\n  query HeroCollections(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 50) {\n      nodes {\n        ...HeroCollection\n      }\n    }\n  }\n": {
    return: HeroCollectionsQuery;
    variables: HeroCollectionsQueryVariables;
  };
  "#graphql\n  fragment ExploreCollection on Collection {\n    id\n    handle\n    title\n    description\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n  }\n\n  query ExploreCollections(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 5) {\n      nodes {\n        ...ExploreCollection\n      }\n    }\n  }\n": {
    return: ExploreCollectionsQuery;
    variables: ExploreCollectionsQueryVariables;
  };
  "#graphql\n  query ProductHandles(\n    $ids: [ID!]!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Product {\n        __typename\n        id\n        handle\n      }\n    }\n  }\n": {
    return: ProductHandlesQuery;
    variables: ProductHandlesQueryVariables;
  };
  "#graphql\n  fragment HomepageArticle on Article {\n    handle\n    title\n    excerpt\n    publishedAt\n    image {\n      url\n      altText\n      width\n      height\n    }\n    blog {\n      handle\n      title\n    }\n    author: authorV2 {\n      name\n    }\n  }\n\n  query RecentBlogArticles(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    blogs(first: 5) {\n      nodes {\n        articles(first: 2, sortKey: PUBLISHED_AT, reverse: true) {\n          nodes {\n            ...HomepageArticle\n          }\n        }\n      }\n    }\n  }\n": {
    return: RecentBlogArticlesQuery;
    variables: RecentBlogArticlesQueryVariables;
  };
  "#graphql\n  query AccountRecentlyViewedProducts(\n    $ids: [ID!]!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Product {\n        __typename\n        id\n        title\n        handle\n        availableForSale\n        tags\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n          maxVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: AccountRecentlyViewedProductsQuery;
    variables: AccountRecentlyViewedProductsQueryVariables;
  };
  "#graphql\n  query RecommendedProducts(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    products(first: 12, sortKey: BEST_SELLING) {\n      nodes {\n        id\n        title\n        handle\n        availableForSale\n        tags\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n          maxVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: RecommendedProductsQuery;
    variables: RecommendedProductsQueryVariables;
  };
  "#graphql\n  query AllProductsForDashboard(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    products(first: 250) {\n      nodes {\n        id\n        title\n        handle\n        availableForSale\n        tags\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n          maxVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        variants(first: 100) {\n          nodes {\n            id\n            title\n            availableForSale\n            selectedOptions {\n              name\n              value\n            }\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: AllProductsForDashboardQuery;
    variables: AllProductsForDashboardQueryVariables;
  };
  "#graphql\n  query OrderProductHandles(\n    $ids: [ID!]!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Product {\n        __typename\n        id\n        handle\n      }\n    }\n  }\n": {
    return: OrderProductHandlesQuery;
    variables: OrderProductHandlesQueryVariables;
  };
  "#graphql\n  query ProductRecommendations(\n    $country: CountryCode\n    $language: LanguageCode\n    $productId: ID!\n  ) @inContext(country: $country, language: $language) {\n    productRecommendations(productId: $productId) {\n      id\n      title\n      handle\n      availableForSale\n      featuredImage {\n        id\n        url\n        altText\n        width\n        height\n      }\n      images(first: 4) {\n        nodes {\n          id\n          url\n          altText\n          width\n          height\n        }\n      }\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n        maxVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      variants(first: 100) {\n        nodes {\n          id\n          title\n          availableForSale\n          quantityAvailable\n          selectedOptions {\n            name\n            value\n          }\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n": {
    return: ProductRecommendationsQuery;
    variables: ProductRecommendationsQueryVariables;
  };
  "#graphql\n  query QuickAddProduct(\n    $country: CountryCode\n    $handle: String!\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      id\n      title\n      handle\n      description\n      tags\n      vendor\n      productType\n      availableForSale\n      featuredImage {\n        id\n        url\n        altText\n        width\n        height\n      }\n      images(first: 20) {\n        nodes {\n          id\n          url\n          altText\n          width\n          height\n        }\n      }\n      options {\n        name\n        optionValues {\n          name\n        }\n      }\n      priceRange {\n        minVariantPrice {\n          amount\n          currencyCode\n        }\n        maxVariantPrice {\n          amount\n          currencyCode\n        }\n      }\n      variants(first: 100) {\n        nodes {\n          id\n          title\n          availableForSale\n          quantityAvailable\n          selectedOptions {\n            name\n            value\n          }\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n          image {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n      seo {\n        title\n        description\n      }\n    }\n  }\n": {
    return: QuickAddProductQuery;
    variables: QuickAddProductQueryVariables;
  };
  "#graphql\n    fragment WishlistProduct on Product {\n        __typename\n        id\n        title\n        handle\n        availableForSale\n        featuredImage {\n            id\n            url\n            altText\n            width\n            height\n        }\n        images(first: 4) {\n            nodes {\n                id\n                url\n                altText\n                width\n                height\n            }\n        }\n        priceRange {\n            minVariantPrice {\n                amount\n                currencyCode\n            }\n            maxVariantPrice {\n                amount\n                currencyCode\n            }\n        }\n        compareAtPriceRange {\n            minVariantPrice {\n                amount\n                currencyCode\n            }\n        }\n        variants(first: 100) {\n            nodes {\n                id\n                title\n                availableForSale\n                selectedOptions {\n                    name\n                    value\n                }\n                price {\n                    amount\n                    currencyCode\n                }\n                compareAtPrice {\n                    amount\n                    currencyCode\n                }\n            }\n        }\n    }\n\n    query WishlistProducts($ids: [ID!]!) {\n        nodes(ids: $ids) {\n            ... on Product {\n                ...WishlistProduct\n            }\n        }\n    }\n": {
    return: WishlistProductsQuery;
    variables: WishlistProductsQueryVariables;
  };
  '#graphql\n  query AppleTouchIcon(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {\n      brandLogo: field(key: "brand_logo") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url altText width height }\n          }\n        }\n      }\n      icon180Apple: field(key: "icon_180_apple") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url altText width height }\n          }\n        }\n      }\n      icon192: field(key: "icon_192") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url altText width height }\n          }\n        }\n      }\n    }\n  }\n': {
    return: AppleTouchIconQuery;
    variables: AppleTouchIconQueryVariables;
  };
  "#graphql\n  query Article(\n    $articleHandle: String!\n    $blogHandle: String!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(language: $language, country: $country) {\n    blog(handle: $blogHandle) {\n      handle\n      title\n      articleByHandle(handle: $articleHandle) {\n        handle\n        title\n        content\n        contentHtml\n        excerpt\n        excerptHtml\n        publishedAt\n        tags\n        author: authorV2 {\n          name\n          bio\n          firstName\n          lastName\n        }\n        image {\n          id\n          altText\n          url\n          width\n          height\n        }\n        seo {\n          description\n          title\n        }\n      }\n      articles(first: 10, sortKey: PUBLISHED_AT, reverse: true) {\n        nodes {\n          handle\n          title\n          excerpt\n          excerptHtml\n          content\n          contentHtml\n          publishedAt\n          tags\n          image {\n            id\n            altText\n            url\n            width\n            height\n          }\n          blog {\n            handle\n            title\n          }\n          author: authorV2 {\n            name\n          }\n        }\n      }\n    }\n  }\n": {
    return: ArticleQuery;
    variables: ArticleQueryVariables;
  };
  "#graphql\n  query Blog(\n    $language: LanguageCode\n    $blogHandle: String!\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(language: $language) {\n    blog(handle: $blogHandle) {\n      title\n      handle\n      seo {\n        title\n        description\n      }\n      articles(\n        first: $first,\n        last: $last,\n        before: $startCursor,\n        after: $endCursor,\n        sortKey: PUBLISHED_AT,\n        reverse: true\n      ) {\n        nodes {\n          handle\n          title\n          excerpt\n          excerptHtml\n          content\n          contentHtml\n          publishedAt\n          tags\n          image {\n            id\n            altText\n            url\n            width\n            height\n          }\n          blog {\n            handle\n            title\n          }\n          author: authorV2 {\n            name\n          }\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          endCursor\n          startCursor\n        }\n      }\n    }\n  }\n": {
    return: BlogQuery;
    variables: BlogQueryVariables;
  };
  "#graphql\n  query BlogsWithArticles(\n    $country: CountryCode\n    $endCursor: String\n    $first: Int\n    $language: LanguageCode\n    $last: Int\n    $startCursor: String\n  ) @inContext(country: $country, language: $language) {\n    blogs(\n      first: $first,\n      last: $last,\n      before: $startCursor,\n      after: $endCursor\n    ) {\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n      nodes {\n        title\n        handle\n        seo {\n          title\n          description\n        }\n        articles(first: 8, sortKey: PUBLISHED_AT, reverse: true) {\n          nodes {\n            handle\n            title\n            excerpt\n            excerptHtml\n            content\n            contentHtml\n            publishedAt\n            tags\n            image {\n              id\n              altText\n              url\n              width\n              height\n            }\n            blog {\n              handle\n              title\n            }\n            author: authorV2 {\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n": {
    return: BlogsWithArticlesQuery;
    variables: BlogsWithArticlesQueryVariables;
  };
  "#graphql\n  query LatestArticles(\n    $first: Int\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {\n      nodes {\n        handle\n        title\n        excerpt\n        excerptHtml\n        content\n        contentHtml\n        publishedAt\n        tags\n        image {\n          id\n          altText\n          url\n          width\n          height\n        }\n        blog {\n          handle\n          title\n        }\n        author: authorV2 {\n          name\n        }\n      }\n    }\n  }\n": {
    return: LatestArticlesQuery;
    variables: LatestArticlesQueryVariables;
  };
  "#graphql\n  #graphql\n  fragment MoneyProductItem on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment ProductItem on Product {\n    id\n    handle\n    title\n    availableForSale\n    tags\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyProductItem\n      }\n      maxVariantPrice {\n        ...MoneyProductItem\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyProductItem\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          ...MoneyProductItem\n        }\n        compareAtPrice {\n          ...MoneyProductItem\n        }\n      }\n    }\n  }\n\n  query Collection(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n    $sortKey: ProductCollectionSortKeys\n    $reverse: Boolean\n    $filters: [ProductFilter!]\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      id\n      handle\n      title\n      description\n      seo {\n        title\n        description\n      }\n      image {\n        url\n        altText\n        width\n        height\n      }\n      products(\n        first: $first\n        last: $last\n        before: $startCursor\n        after: $endCursor\n        sortKey: $sortKey\n        reverse: $reverse\n        filters: $filters\n      ) {\n        nodes {\n          ...ProductItem\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n": {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  query SidebarCollectionsHandle(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 50, sortKey: TITLE) {\n      nodes {\n        id\n        handle\n        title\n        products(first: 250) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n    allProducts: products(first: 250, query: "available_for_sale:true") {\n      nodes {\n        id\n        availableForSale\n        variants(first: 10) {\n          nodes {\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: SidebarCollectionsHandleQuery;
    variables: SidebarCollectionsHandleQueryVariables;
  };
  "#graphql\n  query CollectionCount(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      products(first: 250) {\n        nodes { id }\n        pageInfo { hasNextPage }\n      }\n    }\n  }\n": {
    return: CollectionCountQuery;
    variables: CollectionCountQueryVariables;
  };
  "#graphql\n  fragment Collection on Collection {\n    id\n    title\n    handle\n    products(first: 250) {\n      nodes {\n        id\n      }\n    }\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n  }\n  query StoreCollections(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    collections(\n      first: $first\n      last: $last\n      before: $startCursor\n      after: $endCursor\n    ) {\n      nodes {\n        ...Collection\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": {
    return: StoreCollectionsQuery;
    variables: StoreCollectionsQueryVariables;
  };
  '#graphql\n  query SaleProducts(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n  ) @inContext(country: $country, language: $language) {\n    products(first: $first, query: "available_for_sale:true") {\n      nodes {\n        id\n        availableForSale\n        featuredImage {\n          id\n          url\n          altText\n          width\n          height\n        }\n        variants(first: 250) {\n          nodes {\n            availableForSale\n            price {\n              amount\n            }\n            compareAtPrice {\n              amount\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: SaleProductsQuery;
    variables: SaleProductsQueryVariables;
  };
  '#graphql\n  query Catalog(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n    $sortKey: ProductSortKeys\n    $reverse: Boolean\n  ) @inContext(country: $country, language: $language) {\n    products(\n      first: $first\n      last: $last\n      before: $startCursor\n      after: $endCursor\n      sortKey: $sortKey\n      reverse: $reverse\n      query: "available_for_sale:true"\n    ) {\n      nodes {\n        ...CollectionItem\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment MoneyCollectionItem on MoneyV2 {\n    amount\n    currencyCode\n  }\n  fragment CollectionItem on Product {\n    id\n    handle\n    title\n    availableForSale\n    tags\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyCollectionItem\n      }\n      maxVariantPrice {\n        ...MoneyCollectionItem\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyCollectionItem\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          ...MoneyCollectionItem\n        }\n        compareAtPrice {\n          ...MoneyCollectionItem\n        }\n      }\n    }\n  }\n\n': {
    return: CatalogQuery;
    variables: CatalogQueryVariables;
  };
  '#graphql\n  query SidebarCollectionsAll(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 50, sortKey: TITLE) {\n      nodes {\n        id\n        handle\n        title\n        products(first: 250) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n    allProducts: products(first: 250, query: "available_for_sale:true") {\n      nodes {\n        id\n        availableForSale\n        variants(first: 10) {\n          nodes {\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: SidebarCollectionsAllQuery;
    variables: SidebarCollectionsAllQueryVariables;
  };
  '#graphql\n  query Favicon(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {\n      brandLogo: field(key: "brand_logo") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url altText width height }\n          }\n        }\n      }\n      favicon: field(key: "favicon") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url }\n          }\n        }\n      }\n      icon192: field(key: "icon_192") {\n        reference {\n          ... on MediaImage {\n            __typename\n            image { url altText width height }\n          }\n        }\n      }\n    }\n  }\n': {
    return: FaviconQuery;
    variables: FaviconQueryVariables;
  };
  '#graphql\n  query GalleryProducts(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int!\n    $after: String\n  ) @inContext(country: $country, language: $language) {\n    products(first: $first, after: $after, query: "available_for_sale:true") {\n      nodes {\n        handle\n        title\n        collections(first: 1) {\n          nodes {\n            handle\n            title\n          }\n        }\n        images(first: 10) {\n          nodes {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n': {
    return: GalleryProductsQuery;
    variables: GalleryProductsQueryVariables;
  };
  "#graphql\n  fragment Policy on ShopPolicy {\n    body\n    handle\n    id\n    title\n    url\n  }\n  query Policy(\n    $country: CountryCode\n    $language: LanguageCode\n    $privacyPolicy: Boolean!\n    $refundPolicy: Boolean!\n    $shippingPolicy: Boolean!\n    $termsOfService: Boolean!\n  ) @inContext(language: $language, country: $country) {\n    shop {\n      privacyPolicy @include(if: $privacyPolicy) {\n        ...Policy\n      }\n      shippingPolicy @include(if: $shippingPolicy) {\n        ...Policy\n      }\n      termsOfService @include(if: $termsOfService) {\n        ...Policy\n      }\n      refundPolicy @include(if: $refundPolicy) {\n        ...Policy\n      }\n    }\n  }\n": {
    return: PolicyQuery;
    variables: PolicyQueryVariables;
  };
  '#graphql\n  query Product(\n    $country: CountryCode\n    $handle: String!\n    $language: LanguageCode\n    $selectedOptions: [SelectedOptionInput!]!\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      ...Product\n    }\n  }\n  #graphql\n  fragment Product on Product {\n    id\n    title\n    vendor\n    handle\n    descriptionHtml\n    description\n    tags\n    encodedVariantExistence\n    encodedVariantAvailability\n    sizeChart: metafield(namespace: "custom", key: "size_chart") {\n      value\n    }\n    collections(first: 10) {\n      nodes {\n        handle\n        title\n      }\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    media(first: 20) {\n      nodes {\n        __typename\n        ... on MediaImage {\n          id\n          alt\n          image {\n            id\n            url\n            altText\n            width\n            height\n          }\n        }\n        ... on Video {\n          id\n          alt\n          sources {\n            url\n            mimeType\n          }\n          previewImage {\n            url\n            altText\n            width\n            height\n          }\n        }\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        availableForSale\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n    options {\n      name\n      optionValues {\n        name\n        firstSelectableVariant {\n          ...ProductVariant\n        }\n        swatch {\n          color\n          image {\n            previewImage {\n              url\n            }\n          }\n        }\n      }\n    }\n    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {\n      ...ProductVariant\n    }\n    adjacentVariants (selectedOptions: $selectedOptions) {\n      ...ProductVariant\n    }\n    seo {\n      description\n      title\n    }\n    requiresSellingPlan\n    sellingPlanGroups(first: 10) {\n      nodes {\n        name\n        appName\n        options {\n          name\n          values\n        }\n        sellingPlans(first: 10) {\n          nodes {\n            id\n            name\n            description\n            recurringDeliveries\n            options {\n              name\n              value\n            }\n            priceAdjustments {\n              adjustmentValue {\n                __typename\n                ... on SellingPlanPercentagePriceAdjustment {\n                  adjustmentPercentage\n                }\n                ... on SellingPlanFixedAmountPriceAdjustment {\n                  adjustmentAmount {\n                    amount\n                    currencyCode\n                  }\n                }\n                ... on SellingPlanFixedPriceAdjustment {\n                  price {\n                    amount\n                    currencyCode\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    availableForSale\n    quantityAvailable\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n    id\n    image {\n      __typename\n      id\n      url\n      altText\n      width\n      height\n    }\n    price {\n      amount\n      currencyCode\n    }\n    product {\n      title\n      handle\n    }\n    selectedOptions {\n      name\n      value\n    }\n    sku\n    title\n    unitPrice {\n      amount\n      currencyCode\n    }\n    sellingPlanAllocations(first: 10) {\n      nodes {\n        sellingPlan {\n          id\n          name\n          options {\n            name\n            value\n          }\n          priceAdjustments {\n            adjustmentValue {\n              __typename\n              ... on SellingPlanPercentagePriceAdjustment {\n                adjustmentPercentage\n              }\n              ... on SellingPlanFixedAmountPriceAdjustment {\n                adjustmentAmount {\n                  amount\n                  currencyCode\n                }\n              }\n              ... on SellingPlanFixedPriceAdjustment {\n                price {\n                  amount\n                  currencyCode\n                }\n              }\n            }\n          }\n        }\n        priceAdjustments {\n          price {\n            amount\n            currencyCode\n          }\n          compareAtPrice {\n            amount\n            currencyCode\n          }\n          perDeliveryPrice {\n            amount\n            currencyCode\n          }\n        }\n      }\n    }\n  }\n\n\n': {
    return: ProductQuery;
    variables: ProductQueryVariables;
  };
  '#graphql\n  query SidebarCollectionsProduct(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 50, sortKey: TITLE) {\n      nodes {\n        id\n        handle\n        title\n        products(first: 250) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n    allProducts: products(first: 250, query: "available_for_sale:true") {\n      nodes {\n        id\n        availableForSale\n        variants(first: 10) {\n          nodes {\n            availableForSale\n            price {\n              amount\n              currencyCode\n            }\n            compareAtPrice {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n': {
    return: SidebarCollectionsProductQuery;
    variables: SidebarCollectionsProductQueryVariables;
  };
  "#graphql\n  query ProductPageRecommendations(\n    $productId: ID!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    productRecommendations(productId: $productId) {\n      ...RecommendedProduct\n    }\n  }\n  #graphql\n  fragment RecommendedProduct on Product {\n    id\n    handle\n    title\n    availableForSale\n    tags\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n": {
    return: ProductPageRecommendationsQuery;
    variables: ProductPageRecommendationsQueryVariables;
  };
  '#graphql\n  query DiscountsPage(\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n  ) @inContext(country: $country, language: $language) {\n    products(\n      first: $first\n      last: $last\n      before: $startCursor\n      after: $endCursor\n      query: "available_for_sale:true"\n    ) {\n      nodes {\n        ...DiscountProduct\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment DiscountProduct on Product {\n    id\n    handle\n    title\n    availableForSale\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    variants(first: 250) {\n      nodes {\n        ...DiscountVariant\n      }\n    }\n  }\n  #graphql\n  fragment DiscountVariant on ProductVariant {\n    id\n    availableForSale\n    price {\n      amount\n      currencyCode\n    }\n    compareAtPrice {\n      amount\n      currencyCode\n    }\n  }\n\n\n': {
    return: DiscountsPageQuery;
    variables: DiscountsPageQueryVariables;
  };
  '#graphql\n  query SidebarCollectionsForDiscounts(\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    collections(first: 50, sortKey: TITLE) {\n      nodes {\n        id\n        handle\n        title\n        products(first: 250) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n    allProducts: products(first: 250, query: "available_for_sale:true") {\n      nodes {\n        id\n        availableForSale\n        variants(first: 10) {\n          nodes {\n            availableForSale\n          }\n        }\n      }\n    }\n  }\n': {
    return: SidebarCollectionsForDiscountsQuery;
    variables: SidebarCollectionsForDiscountsQueryVariables;
  };
  "#graphql\n  query SearchCollections(\n    $country: CountryCode\n    $language: LanguageCode\n    $query: String!\n    $first: Int!\n  ) @inContext(country: $country, language: $language) {\n    collections(query: $query, first: $first, sortKey: RELEVANCE) {\n      nodes {\n        ...SearchCollection\n      }\n      totalCount\n    }\n  }\n  #graphql\n  fragment SearchCollection on Collection {\n    __typename\n    id\n    handle\n    title\n    description\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n    products(first: 1) {\n      nodes {\n        id\n        availableForSale\n      }\n    }\n  }\n\n": {
    return: SearchCollectionsQuery;
    variables: SearchCollectionsQueryVariables;
  };
  "#graphql\n  query RegularSearch(\n    $country: CountryCode\n    $language: LanguageCode\n    $term: String!\n    $productFirst: Int!\n    $productAfter: String\n    $articleFirst: Int!\n    $articleAfter: String\n  ) @inContext(country: $country, language: $language) {\n    products: search(\n      query: $term,\n      types: [PRODUCT],\n      first: $productFirst,\n      after: $productAfter,\n      sortKey: RELEVANCE,\n      unavailableProducts: HIDE,\n    ) {\n      nodes {\n        ...on Product {\n          ...SearchProduct\n        }\n      }\n      pageInfo {\n        ...PageInfoFragment\n      }\n      totalCount\n    }\n    articles: search(\n      query: $term,\n      types: [ARTICLE],\n      first: $articleFirst,\n      after: $articleAfter,\n    ) {\n      nodes {\n        ...on Article {\n          ...SearchArticle\n        }\n      }\n      pageInfo {\n        ...PageInfoFragment\n      }\n      totalCount\n    }\n  }\n  #graphql\n  fragment SearchProduct on Product {\n    __typename\n    handle\n    id\n    title\n    trackingParameters\n    availableForSale\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n  #graphql\n  fragment SearchArticle on Article {\n    __typename\n    handle\n    id\n    title\n    trackingParameters\n    excerpt(truncateAt: 150)\n    publishedAt\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n    blog {\n      handle\n      title\n    }\n  }\n\n  #graphql\n  fragment PageInfoFragment on PageInfo {\n    hasNextPage\n    hasPreviousPage\n    startCursor\n    endCursor\n  }\n\n": {
    return: RegularSearchQuery;
    variables: RegularSearchQueryVariables;
  };
  "#graphql\n  query SearchProducts(\n    $country: CountryCode\n    $language: LanguageCode\n    $term: String!\n    $first: Int!\n    $after: String\n  ) @inContext(country: $country, language: $language) {\n    products: search(\n      query: $term,\n      types: [PRODUCT],\n      first: $first,\n      after: $after,\n      sortKey: RELEVANCE,\n      unavailableProducts: HIDE,\n    ) {\n      nodes {\n        ...on Product {\n          ...SearchProduct\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment SearchProduct on Product {\n    __typename\n    handle\n    id\n    title\n    trackingParameters\n    availableForSale\n    featuredImage {\n      id\n      altText\n      url\n      width\n      height\n    }\n    images(first: 10) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    variants(first: 100) {\n      nodes {\n        id\n        title\n        availableForSale\n        selectedOptions {\n          name\n          value\n        }\n        price {\n          amount\n          currencyCode\n        }\n        compareAtPrice {\n          amount\n          currencyCode\n        }\n      }\n    }\n  }\n\n": {
    return: SearchProductsQuery;
    variables: SearchProductsQueryVariables;
  };
  "#graphql\n  query SearchArticles(\n    $country: CountryCode\n    $language: LanguageCode\n    $term: String!\n    $first: Int!\n    $after: String\n  ) @inContext(country: $country, language: $language) {\n    articles: search(\n      query: $term,\n      types: [ARTICLE],\n      first: $first,\n      after: $after,\n    ) {\n      nodes {\n        ...on Article {\n          ...SearchArticle\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n  #graphql\n  fragment SearchArticle on Article {\n    __typename\n    handle\n    id\n    title\n    trackingParameters\n    excerpt(truncateAt: 150)\n    publishedAt\n    image {\n      id\n      url\n      altText\n      width\n      height\n    }\n    blog {\n      handle\n      title\n    }\n  }\n\n": {
    return: SearchArticlesQuery;
    variables: SearchArticlesQueryVariables;
  };
  "#graphql\n  query PredictiveSearch(\n    $country: CountryCode\n    $language: LanguageCode\n    $limit: Int!\n    $limitScope: PredictiveSearchLimitScope!\n    $term: String!\n    $types: [PredictiveSearchType!]\n  ) @inContext(country: $country, language: $language) {\n    predictiveSearch(\n      limit: $limit,\n      limitScope: $limitScope,\n      query: $term,\n      types: $types,\n    ) {\n      articles {\n        ...PredictiveArticle\n      }\n      collections {\n        ...PredictiveCollection\n      }\n      pages {\n        ...PredictivePage\n      }\n      products {\n        ...PredictiveProduct\n      }\n      queries {\n        ...PredictiveQuery\n      }\n    }\n  }\n  #graphql\n  fragment PredictiveArticle on Article {\n    __typename\n    id\n    title\n    handle\n    blog {\n      handle\n    }\n    image {\n      url\n      altText\n      width\n      height\n    }\n    trackingParameters\n  }\n\n  #graphql\n  fragment PredictiveCollection on Collection {\n    __typename\n    id\n    title\n    handle\n    image {\n      url\n      altText\n      width\n      height\n    }\n    trackingParameters\n    products(first: 1) {\n      nodes {\n        id\n        availableForSale\n      }\n    }\n  }\n\n  #graphql\n  fragment PredictivePage on Page {\n    __typename\n    id\n    title\n    handle\n    trackingParameters\n  }\n\n  #graphql\n  fragment PredictiveProduct on Product {\n    __typename\n    id\n    title\n    handle\n    availableForSale\n    trackingParameters\n    selectedOrFirstAvailableVariant(\n      selectedOptions: []\n      ignoreUnknownOptions: true\n      caseInsensitiveMatch: true\n    ) {\n      id\n      image {\n        url\n        altText\n        width\n        height\n      }\n      price {\n        amount\n        currencyCode\n      }\n      compareAtPrice {\n        amount\n        currencyCode\n      }\n    }\n  }\n\n  #graphql\n  fragment PredictiveQuery on SearchQuerySuggestion {\n    __typename\n    text\n    styledText\n    trackingParameters\n  }\n\n": {
    return: PredictiveSearchQuery;
    variables: PredictiveSearchQueryVariables;
  };
  "#graphql\n    fragment SharedWishlistProduct on Product {\n        __typename\n        id\n        title\n        handle\n        availableForSale\n        featuredImage {\n            id\n            url\n            altText\n            width\n            height\n        }\n        images(first: 4) {\n            nodes {\n                id\n                url\n                altText\n                width\n                height\n            }\n        }\n        priceRange {\n            minVariantPrice {\n                amount\n                currencyCode\n            }\n            maxVariantPrice {\n                amount\n                currencyCode\n            }\n        }\n        compareAtPriceRange {\n            minVariantPrice {\n                amount\n                currencyCode\n            }\n        }\n        variants(first: 100) {\n            nodes {\n                id\n                title\n                availableForSale\n                selectedOptions {\n                    name\n                    value\n                }\n                price {\n                    amount\n                    currencyCode\n                }\n                compareAtPrice {\n                    amount\n                    currencyCode\n                }\n            }\n        }\n    }\n\n    query SharedWishlistProducts($ids: [ID!]!) {\n        nodes(ids: $ids) {\n            ... on Product {\n                ...SharedWishlistProduct\n            }\n        }\n    }\n": {
    return: SharedWishlistProductsQuery;
    variables: SharedWishlistProductsQueryVariables;
  };
}

interface GeneratedMutationTypes {
  "#graphql\n  mutation customerCreate($input: CustomerCreateInput!) {\n    customerCreate(input: $input) {\n      customer {\n        id\n        email\n      }\n      customerUserErrors {\n        code\n        field\n        message\n      }\n    }\n  }\n": {
    return: CustomerCreateMutation;
    variables: CustomerCreateMutationVariables;
  };
}

declare module "@shopify/hydrogen" {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
