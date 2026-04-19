// Pricing configuration
// Stripe LIVE price IDs validated on 2026-03-01.

export const PRICING = {
  perProject: {
    amount: 2000,
    display: "$2,000",
    period: "/project",
    name: "Per Project",
    stripePriceId: "price_1T5toZP5elf35CKlGuxS6JKU",
  },
  doneForYou: {
    amount: 4000,
    display: "$4,000",
    period: "/project",
    name: "Done-For-You",
    stripePriceId: "price_1TO31eP5elf35CKlvFWoVrUk",
  },
  dfyUpgradeFromPerProject: {
    amount: 2000,
    display: "$2,000",
    period: "/project",
    name: "DFY Upgrade",
    // = doneForYou.amount - perProject.amount ($4,000 - $2,000)
  },
  monthly: {
    amount: 5000,
    display: "$5,000",
    period: "/month",
    name: "Monthly",
    includedProjects: 3,
    overagePerProject: 1000,
    overagePriceId: "price_1T6FKzP5elf35CKl5F1XyETh",
    stripePriceId: "price_1TO33aP5elf35CKlC4eFMpm2",
  },
} as const;
