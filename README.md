# ENA COLLECTION (project PRIORITY)

Online shop for ENA COLLECTION. Next.js + Supabase. Customers sign up, fill a cart, place an order,
pay by bank transfer and upload their receipt. The owner confirms the receipt and
moves the order through delivery (the owner arranges the rider herself). Customers watch the progress on their order page.

## What is inside
- `src/`        the website (shop, cart, checkout, customer account, owner dashboard)
- `public/`     logo
- `supabase/`   database files. Run `001_schema.sql` and then `002_admin_tools.sql` in the Supabase SQL Editor
- `vercel.json` a daily request that keeps the free Supabase project awake
- `.env.local.example` the two settings the site needs

## Set up on your laptop
1. Create the project (once):
   `npx create-next-app@latest ena-collection --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
2. In the project folder: `npm install @supabase/supabase-js @supabase/ssr`
3. Copy everything from this zip into the project folder (choose Replace). Delete `src/app/favicon.ico`.
4. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and publishable key.
5. Run `npm run dev` and open http://localhost:3000

## Set up Supabase (once)
1. SQL Editor: run `supabase/001_schema.sql`, then `supabase/002_admin_tools.sql`.
2. Authentication > Users: add the owner (imadeprecious670@gmail.com) with a password.
3. SQL Editor: make the owner an admin
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'imadeprecious670@gmail.com');`
4. Sign in at /login as the owner, open Dashboard > Settings and enter the bank details.
5. Optional: Authentication > Providers > Email: turn off "Confirm email" while testing.

## Sign in with Google (free)
1. Supabase: Authentication > Sign In / Providers > Google. Turn it on and copy the Callback URL shown there.
2. console.cloud.google.com: create a project, then APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
   Add the Supabase Callback URL under Authorized redirect URIs. Copy the Client ID and Client secret.
   (If asked, set up the OAuth consent screen first.)
3. Paste the Client ID and Client secret into the Google provider in Supabase and save.
4. Supabase: Authentication > URL Configuration: add `http://localhost:3000/**` (and later your Vercel address with `/**`) to Redirect URLs.
5. Apple (iCloud) sign-in is not included: it needs a paid Apple Developer membership.

## Put it online (free)
1. Create a GitHub repository and push the project (`.env.local` is ignored by git on purpose).
2. On vercel.com choose Add New > Project, import the repository.
3. In Vercel, add the same two environment variables from `.env.local`, then Deploy.
4. In Supabase, Authentication > URL Configuration: set Site URL to your Vercel address
   (for example https://your-shop.vercel.app) and add `https://your-shop.vercel.app/**` to Redirect URLs.
   This makes password reset emails work.

## Owner day-to-day
- Orders: open an order, check the receipt against the bank alert, Confirm or Reject.
- Then: Start processing, Mark ready, Out for delivery, Delivered. When marking out for delivery, you can type a message for the customer (for example the rider's name and number).
- Products: Dashboard > Products. Categories: launch Clothing when ready. Delivery fees have their own page.

## Not built yet
- Paystack (the payments table is ready for it).
- Automatic customer emails (needs a domain name). Use the "Message customer on WhatsApp" button on each order.
- Discount codes.
