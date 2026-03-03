# Release Notes v1.0.0

🎉 **Initial Stable Release**

## 🌟 Key Features
- **Multi-Tenant Chat**: Widget-based chat with connection isolation.
- **Admin Control**: Approval workflows for all extracted data.
- **Explainable AI**: RAG-lite system with "Shadow Knowledge" and source citations.
- **Behavior Engine**: Deterministic prompt profiling (Pricing vs Support modes).
- **Security**: Rate-limited, schema-locked, and environment-isolated.

## 🛡️ Guarantees
- **No Hallucinations**: AI refuses to answer if no ACTIVE knowledge is present.
- **Zero Schema Drift**: Migrations required for all DB changes.
- **Resilience**: Automated `requestId` tracing and structured logging.

## 📦 Artifacts
- API: `/api/v1`
- Admin Panel: `/admin`
- Widget: `/widget.js`
