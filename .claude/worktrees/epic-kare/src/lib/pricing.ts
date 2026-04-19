// Founder Pricing – Launch Phase
// IMPORTANT: Update Stripe Price IDs before production deploy.
// Archive old prices in Stripe (do NOT delete for historical invoices).

export const PRICING = {
  perProject: {
    amount: 2000,
    display: "$2,000",
    period: "/project",
    name: "Per Project",
    founderPricing: true,
    stripePriceId: "REPLACE_WITH_STRIPE_PRICE_ID_PER_PROJECT_2000",
  },
  doneForYou: {
    amount: 3500,
    display: "$3,500",
    period: "/project",
    name: "Done-For-You",
    founderPricing: true,
    stripePriceId: "REPLACE_WITH_STRIPE_PRICE_ID_DFY_3500",
  },
  monthly: {
    amount: 4000,
    display: "$4,000",
    period: "/month",
    name: "Monthly",
    founderPricing: true,
    includedProjects: 3,
    overagePerProject: 1000,
    overagePriceId: "price_1T5upBP5elf35CKlGmuXJwkt",
    stripePriceId: "REPLACE_WITH_STRIPE_PRICE_ID_MONTHLY_4000",
  },
} as const;
