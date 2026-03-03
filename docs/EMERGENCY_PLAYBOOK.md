# 🚨 EMERGENCY PLAYBOOK

**System**: Chatbot Backend V1.0
**RPO**: 24 Hours
**RTO**: 1 Hour

---

## 🛑 Immediate Kill Switches
If the system is acting dangerously (spamming, leaking data), use these Environment Variables to disable features without redeploying.

| Event | Action | Variable | Value |
|-------|--------|----------|-------|
| **AI hallucinating / cost spike** | Kill AI | `AI_ENABLED` | `false` |
| **Widget spamming backend** | Kill Widget | `WIDGET_ENABLED` | `false` |
| **Malicious extraction requests** | Kill Extraction | `EXTRACTION_ENABLED` | `false` |

**How to apply**:
1. Go to AWS / Hosting Dashboard.
2. Update Environment Variables.
3. Restart Service.

---

## 💾 Database Restore Procedure
If the database is corrupted or deleted.

1. **Locate Backup**: Check `backups/` directory or S3 bucket.
2. **Stop Traffic**: Pause the backend service if possible.
3. **Run Restore Script**:
   ```bash
   cd backend
   node scripts/backup_manager.js restore ./backups/backup-YYYY-MM-DD
   ```
4. **Verify**: Check `/health` and Admin Panel.

---

## 🔄 Secret Rotation
If `OPENAI_API_KEY` or `DB_PASSWORD` is compromised.

1. ** revoke** the old key in the provider's dashboard (OpenAI / Supabase).
2. **Generate** a new key.
3. **Update** `.env` (local) or Environment Variables (production).
4. **Restart** the backend.
5. **Monitor** logs for `AUTH_ERROR`.

---

## 📢 Downtime Communication Template
> "We are currently experiencing an issue with [AI Responses / Database]. We have paused the service to investigate. User data is [Safe / Being Restored]. Expected resolution in 1 hour."
