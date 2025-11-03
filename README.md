# School SAS Monorepo

This repo contains the School SAS services and apps.

Tech choices: MongoDB, RabbitMQ, AWS, Twilio (WhatsApp), Razorpay.

Quick start
- Install pnpm and Node 18+.
- `pnpm install` (may require network access).
- `pnpm dev` to run all services in dev once dependencies are installed.

Structure
- `apps/` Next.js frontend (placeholder)
- `services/` Node/TS microservices (auth, study, notification, payment, reporting)
- `packages/` shared libs and configs
- `infra/` k8s/terraform placeholders
- `docs/` architecture and ADRs

