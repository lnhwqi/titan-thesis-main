# AI Data Access Policy

## 1) Scope Model (mandatory)

Vector documents are tagged with one of these scopes:

- PUBLIC
- USER_PRIVATE
- SELLER_PRIVATE
- ADMIN_PRIVATE

Access is fail-closed:

- Guest: PUBLIC only
- User: PUBLIC + USER_PRIVATE where ownerId matches actor user id
- Seller: PUBLIC + SELLER_PRIVATE where shopId matches actor seller id
- Admin: PUBLIC + ADMIN_PRIVATE only

Legacy private scopes are normalized to ADMIN_PRIVATE to avoid accidental
leakage.

## 2) Ingestion Safety

- Deny-by-default table policy.
- Column allow-lists per table.
- Global sensitive deny-list blocks columns related to:
  - password/hash
  - refresh/jwt/token/secret
  - email/phone/address
  - wallet/bank/tax secrets
  - internal moderation notes
- Only sanitized text chunks are stored in `ai_vector_document.content`.
- Chunks are generated from sanitized rows before embedding.

## 3) Current Source Rollout

`AI_RAG_PHASE` controls rollout:

- Phase 1 (default): PUBLIC-only sources
  - category, product, productImage, product_variant, seller public profile
    fields, poster, voucher, market_config
- Phase 2: enables USER_PRIVATE / SELLER_PRIVATE retrieval paths
- Phase 3: allows order/report ingestion with owner metadata

Order/report data uses owner metadata and remains phase-gated.

## 4) Vector Store Strategy

Default strategy is pgvector in PostgreSQL.

Optional external vector DB is allowed only when both are configured:

- `AI_VECTOR_EXTERNAL_PRIVATE_NETWORK=true`
- `AI_VECTOR_EXTERNAL_AUTH_MODE=service-to-service`

Runtime enforces these requirements.

## 5) Retrieval and Answer Safety

- Mandatory actor metadata filter is applied in SQL before similarity ranking.
- Top-K retrieval includes score threshold filtering.
- If confidence is low, assistant returns safe insufficient-context fallback.
- Prompt injection guard strips tool/system-directive style text from user
  question and retrieved context.
- Output PII guard redacts email/phone/high-risk numeric patterns before emit.

## 6) Abuse Controls and Audit

- Rate limits are applied by user id, socket id, and guest IP.
- Support AI metrics log includes:
  - actor hash
  - query hash
  - model id
  - retrieved chunk IDs
  - latency
  - refusal reason

## 7) Secrets and Key Management

- Gemini key is loaded at runtime from environment injection.
- Do not commit Gemini secrets in repository env files.
- Prefer Secret Manager / Vault injection for runtime workloads.
- Restrict Gemini key usage by service identity/network policy.
