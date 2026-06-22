// Pricing configuration
// Stripe LIVE price IDs. DIY/DFY repriced 2026-06-22 (DIY $2,000->$1,000, DFY $4,000->$5,000).

export const PRICING = {
  perProject: {
    amount: 1000,
    display: "$1,000",
    period: "/project",
    name: "Per Project",
    stripePriceId: "price_1TlFJUP5elf35CKlW7uqJmZ0",
  },
  doneForYou: {
    amount: 5000,
    display: "$5,000",
    period: "/project",
    name: "Done-For-You",
    stripePriceId: "price_1TlFJUP5elf35CKloDVozalA",
  },
  dfyUpgradeFromPerProject: {
    amount: 4000,
    display: "$4,000",
    period: "/project",
    name: "DFY Upgrade",
    // = doneForYou.amount - perProject.amount ($5,000 - $1,000)
  },
} as const;
