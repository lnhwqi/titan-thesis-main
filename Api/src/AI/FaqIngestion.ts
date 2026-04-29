/**
 * Static platform FAQ items ingested into the vector store so they are
 * retrieved by semantic search alongside product/seller/voucher context.
 *
 * Each item has a stable slug used as the Pinecone document ID, so
 * re-running the FAQ ingestion is fully idempotent.
 */

export type FaqItem = {
  /** Stable identifier — used as the vector store document ID. */
  slug: string
  /** Natural-language content that will be embedded and stored. */
  content: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    slug: "faq-register",
    content: `How to create an account or register on AT Ecommerce Platform.
To register, visit the platform and click the "Register" or "Sign Up" button in the top navigation bar.
Fill in your full name, email address, and a secure password, then click "Create Account".
You will receive a confirmation email — click the link inside to activate your account.
After activation, you can log in and start shopping immediately.`,
  },
  {
    slug: "faq-login",
    content: `How to log in to AT Ecommerce Platform.
To sign in, click the "Login" button in the top navigation bar.
Enter your registered email address and password, then click "Sign In".
If you do not have an account yet, click "Register" instead.
Login is required to place orders, track purchases, save addresses, and use vouchers.`,
  },
  {
    slug: "faq-forgot-password",
    content: `How to reset a forgotten password on AT Ecommerce Platform.
If you forgot your password, click "Login" and then "Forgot password?".
Enter your registered email address and click "Send reset link".
Check your inbox for a password reset email and follow the link to create a new password.
If you do not receive the email within a few minutes, check your spam folder or contact support.`,
  },
  {
    slug: "faq-search-products",
    content: `How to search for products on AT Ecommerce Platform.
Use the search bar at the top of any page and type a product name, brand, or keyword, then press Enter.
You can narrow down results using filters on the left panel: category, price range, seller rating, and more.
Clicking a category in the navigation menu also shows all products in that category.
Sort results by price (low to high, high to low), newest, or best-rated using the sort dropdown.`,
  },
  {
    slug: "faq-browse-categories",
    content: `How to browse product categories on AT Ecommerce Platform.
Click the "Categories" menu at the top of the page to see all available product categories.
Categories include clothing, electronics, home goods, beauty, food, and more.
Each category can have sub-categories — click any sub-category to see specific products.
You can also filter products by category after performing a search.`,
  },
  {
    slug: "faq-add-to-cart",
    content: `How to add products to the cart and checkout on AT Ecommerce Platform.
Open a product page and select the desired variant (size, color, quantity), then click "Add to Cart".
Access your cart by clicking the cart icon in the top navigation bar.
Review the items and quantities in your cart, then click "Proceed to Checkout".
At checkout, confirm your shipping address, choose a payment method, and apply any voucher codes before placing the order.`,
  },
  {
    slug: "faq-payment-methods",
    content: `What payment methods are accepted on AT Ecommerce Platform.
The platform supports the following payment methods:
- Online payment via bank card (Visa, Mastercard, domestic ATM card)
- E-wallet payment (MoMo, ZaloPay, and other supported wallets)
- Cash on Delivery (COD): pay in cash when your order arrives
Select your preferred payment method at checkout.
For COD orders, exact change is appreciated.`,
  },
  {
    slug: "faq-track-order",
    content: `How to track an order on AT Ecommerce Platform.
After placing an order, go to "My Orders" in your account dashboard.
Each order shows its current status: Processing, Confirmed, Shipping, Delivered, or Cancelled.
Click an order to see detailed tracking information and estimated delivery time.
You will also receive email or in-app notifications when your order status changes.`,
  },
  {
    slug: "faq-cancel-order",
    content: `How to cancel an order on AT Ecommerce Platform.
You can cancel an order from "My Orders" in your account dashboard while its status is still "Processing" or "Confirmed".
Click the order, then click "Cancel Order" and select a reason.
Once an order has been shipped it can no longer be cancelled — contact the seller or support instead.
For prepaid orders, a refund will be issued within the platform's refund window.`,
  },
  {
    slug: "faq-return-refund",
    content: `How to return a product and get a refund on AT Ecommerce Platform.
If you received a damaged, incorrect, or unsatisfactory item, you can request a return within the return window stated on the product page (typically 7 days after delivery).
Go to "My Orders", select the relevant order, and click "Request Return / Refund".
Describe the issue and attach photos if required.
After the seller or platform approves the return, ship the item back and the refund will be processed within the stated timeframe.`,
  },
  {
    slug: "faq-voucher-discount",
    content: `How to use vouchers and discount codes on AT Ecommerce Platform.
Vouchers can be applied at checkout. Enter the voucher code in the "Discount code" field and click "Apply".
A valid voucher will reduce your order total by the stated discount percentage.
Some vouchers have a minimum order value requirement — the cart total must meet this amount for the voucher to apply.
Each voucher has a usage limit and expiry date. Check the voucher details in "My Vouchers" or on the promotions page.`,
  },
  {
    slug: "faq-seller-vacation-mode",
    content: `What is seller vacation mode on AT Ecommerce Platform.
Sellers can enable vacation mode when they are temporarily unable to process orders (e.g., on holiday or during a break).
When a shop is in vacation mode, its products are still visible but cannot be purchased until vacation mode is turned off.
If a product you want to buy is unavailable because the seller is on vacation, check back later or look for the same product from another seller.`,
  },
  {
    slug: "faq-product-rating-review",
    content: `How to rate and review a product on AT Ecommerce Platform.
After receiving your order, you can leave a rating and written review for the product.
Go to "My Orders", find the delivered order, and click "Write a Review".
Select a star rating from 1 to 5, write your feedback, and optionally upload photos.
Your review helps other buyers make informed decisions and helps sellers improve their products.`,
  },
  {
    slug: "faq-contact-support",
    content: `How to contact AT Ecommerce Platform customer support.
If you need help, you can reach our support team through the following channels:
- Live chat: click the chat icon in the bottom-right corner of any page
- Help centre: visit the "Help" or "Support" page in the footer for FAQs and self-service guides
- Email support: send a message via the contact form on the Help page
Our support team is available during business hours and will respond as quickly as possible.`,
  },
  {
    slug: "faq-seller-register",
    content: `How to register as a seller on AT Ecommerce Platform.
To open a shop, log in to your account and navigate to "Become a Seller" or "Open a Shop" in the account menu.
Fill in your shop name, business description, and required identity/tax information.
After submission, the platform will review your application. You will be notified by email once your seller account is approved.
Verified sellers receive a verification badge visible to buyers.`,
  },
]
