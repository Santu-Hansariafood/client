# Saria AI User Guide

Saria AI is available after login for Admin and Employee users.

## Getting Started

1. Log in as an Admin or Employee.
2. Click the green Saria AI button.
3. Type a request in simple English, or use the microphone button.
4. Review the response and use any suggested follow-up command.

Saria AI displays application data and generates reports. It does not silently create, update, or delete records.

## Payment Requests

- `Payment of Sauda 12345`
- `Payment details for Sauda 12345`
- `Show payment status for Sauda 12345`
- `Show due amount for Seller Name`
- `Show outstanding amount for Seller Name`
- `Payment list`
- `Payment details for Bill 4567`
- `Payment status report`
- `Due list`
- `Finance report`

Payment responses can include payment history, payment mode, amount, payment terms, GST/CD rates, allocated amounts, and pending amounts.

## Loading Requests

- `Loading entries for Sauda 12345`
- `Add loading for Sauda 12345`
- `Loading details for Lorry WB12AB1234`
- `Show details for Bill 4567`
- `Show today's loading`
- `Show pending loading for Seller Name`
- `Download lorry report WB12AB1234`

Loading responses can include loading weight, unloading weight, lorry number, bill number, Sauda number, buyer, seller, and payment status.

Important: `Add loading for Sauda 12345` displays the Sauda details and prepares the workflow. Open the Loading Entry page and save the loading form manually. Saria AI does not directly create or save loading records.

## Sauda Requests

- `Sauda 12345 details`
- `Check reminder for Sauda 12345`
- `Show reminder for Sauda 12345`
- `Sauda 12345 follow-up`
- `Show pending Saudas for Seller Name`
- `Total sauda today`
- `Show the latest Sauda`
- `Show Sauda for Company Name to Consignee Name`
- `Show Sauda adjustment report`

The Sauda reminder report includes contract details, loading and delivery progress, lorry and bill details, payment history, claims, estimated outstanding amount, pending quantity, and follow-up actions.

## Consignee Top Sellers

- `Top sellers for consignee Consignee Name`
- `Show top sellers for consignee Consignee Name`
- `Show more top sellers for consignee Consignee Name`

The first request displays 10 ranked sellers. The `Show more` request displays the next 10 with seller name, company, phone, Sauda quantity, and last Sauda date.

## Buyer, Seller, and Company

- `Buyer ABC details`
- `Seller XYZ details`
- `Company ABC status`
- `Relationship between buyer ABC and seller XYZ`
- `Show commodities`
- `Show account status`
- `Generate app report`

## Calling Contacts

Saria AI can find a phone number and provide a user-clicked call button:

- `Call seller Rahul`
- `Call buyer ABC Traders`
- `Call employee Amit`

The call button opens the device phone handler. Saria AI does not place a call without the user's click.

## Email Reports

Saria AI prepares the recipient and report preview first. Review the displayed recipient and click `Confirm & Send PDF`.

- `Send Sauda PDF for Sauda 12345 to seller Rahul`
- `Send Sauda PDF for Sauda 12345 to buyer ABC Traders`
- `Send claim report for Sauda 12345 to seller Rahul`
- `Send payment ledger to seller Rahul`
- `Send payment ledger to buyer ABC Traders`
- `Send Sauda PDF for Sauda 12345` sends to both the buyer and seller
- `Send claim email for Sauda 12345` sends to both the buyer and seller
- `Send payment email for Sauda 12345` sends to both the buyer and seller
- `Send claim email for Sauda 12345 Lorry ABC123` filters by both numbers
- `Send payment email for Sauda 12345 Lorry ABC123` filters by both numbers

Buyer and seller names are optional when a Sauda number is provided. Saria AI
looks up both parties, shows both email addresses and the Sauda/lorry numbers for
confirmation before sending.

The configured mailbox is selected by report type:

- Sauda PDF: Sauda email account
- Claim report: Claims email account
- Payment ledger: Payment email account using the configured SMTP/app password

## Bids and Navigation

- `Active bids`
- `Highest rate today`
- `Show bid interactions for Rice`
- `Show details for 22 March`
- `Show sidebar menu`
- `Show recent pages`
- `Go back to Payment List`

## Typo Correction

Saria AI corrects common small typing mistakes automatically, including examples such as:

- `payemnt` -> `payment`
- `loadng` -> `loading`
- `saller` -> `seller`
- `byuer` -> `buyer`
- `emploee` -> `employee`
- `cosignee` -> `consignee`

## Teaching Custom Shortcuts

Teach a shortcut with:

`When I say today's business, show total sauda today`

After saving it, saying `today's business` triggers the learned shortcut. You can also use:

`Remember that when I say daily report, show finance report`

To remove a learned shortcut:

`Forget command daily report`

Learned shortcuts are stored locally for the current browser and survive page reloads. They are not training or changing the underlying AI model.

## Important Limitations

- Saria AI displays records and generates reports; it does not directly save new Saudas, loading entries, payments, or adjustments.
- Email sending always requires reviewing the recipient and clicking the confirmation button.
- Calling always requires clicking the call button.
- Report results depend on the user's role and access permissions.
