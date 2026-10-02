-- QL-003 database foundation draft
-- Review before production use. This keeps the SQL side aligned with the local repository model.

create index if not exists idx_contacts_primary_brand on contacts(primary_brand);
create index if not exists idx_contacts_phone on contacts(phone);
create index if not exists idx_contacts_email on contacts(email);

create index if not exists idx_conversations_brand_status on conversations(brand, status);
create index if not exists idx_conversations_contact on conversations(contact_id);
create index if not exists idx_conversations_last_activity on conversations(last_activity_at desc);

create index if not exists idx_messages_conversation_created on messages(conversation_id, created_at);
create index if not exists idx_follow_up_tasks_brand_status on follow_up_tasks(brand, status);
create index if not exists idx_intake_requests_brand_status on intake_requests(brand, status);

-- Future production migration should add check constraints/enums for accepted brand keys and statuses.
-- Future production migration should add RLS policies before any customer data is stored in a hosted database.
