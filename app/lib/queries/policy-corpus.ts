export const POLICIES_CORPUS_QUERY = `#graphql
  query PoliciesCorpus($language: LanguageCode) @inContext(language: $language) {
    shop {
      id
      privacyPolicy { id title handle body url }
      shippingPolicy { id title handle body url }
      refundPolicy { id title handle body url }
      termsOfService { id title handle body url }
    }
  }
` as const;
