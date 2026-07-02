// Pricing configuration
// Stripe LIVE price IDs. DFY $5,000; Monthly $5,000 (reverted from $4,000 on 2026-07-02).

export const PRICING = {
  perProject: {
    amount: 2000,
    display: "$2,000",
    period: "/project",
    name: "Per Project",
    stripePriceId: "price_1T5toZP5elf35CKlGuxS6JKU",
  },
  doneForYou: {
    amount: 5000,
    display: "$5,000",
    period: "/project",
    name: "Done-For-You",
    stripePriceId: "price_1TlFJUP5elf35CKloDVozalA",
  },
  dfyUpgradeFromPerProject: {
    amount: 3000,
    display: "$3,000",
    period: "/project",
    name: "DFY Upgrade",
    // = doneForYou.amount - perProject.amount ($5,000 - $2,000)
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
