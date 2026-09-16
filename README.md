# ai-slice — Receipt AI Integration Slice

A single working flow: upload a receipt (image or PDF), a background job sends
it to Gemini, and structured data (merchant, total, line items) comes back
validated and stored. A follow-up model can summarise the result.

Built as Assessment 3 of a Product Engineering Bootcamp. Authentication is
reused from Assessment 1 (see `DOCUMENTATION.md`, Section 1).

**Full documentation, including setup, the data model, and the concepts
behind every engineering decision, is in [`DOCUMENTATION.md`](./DOCUMENTATION.md).**

## Quick start

```bash
npm install
cp .env.example .env   # fill in real values by hand, never via an agent
npx prisma migrate dev
```

Two processes run simultaneously, in two terminals:

```bash
npm run dev      # the Next.js app
npm run worker   # the background job worker
```

Open [http://localhost:3000/receipts/upload](http://localhost:3000/receipts/upload)
to start the flow. Sign up first at `/signup`.

## Stack

Next.js · TypeScript · Prisma · PostgreSQL · Cloudflare R2 · Gemini (`@google/genai`)