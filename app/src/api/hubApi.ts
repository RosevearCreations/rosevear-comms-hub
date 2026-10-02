import type { BrandId, Conversation, ConversationStatus, HubDatabase, ManualLeadInput } from '../types';
import { addInternalNote, createFollowUpTask, createManualLead, importHubDb, updateConversationStatus } from '../storage/localRepository';

export interface HubApi {
  createManualLead(input: ManualLeadInput): { db: HubDatabase; conversationId: string };
  updateConversationStatus(conversationId: string, status: ConversationStatus): HubDatabase;
  addInternalNote(conversationId: string, body: string): HubDatabase;
  createFollowUpTask(conversation: Conversation, title: string): HubDatabase;
  importDatabase(rawJson: string): { ok: true; db: HubDatabase } | { ok: false; error: string };
}

export function createLocalHubApi(db: HubDatabase): HubApi {
  return {
    createManualLead: (input) => createManualLead(db, input),
    updateConversationStatus: (conversationId, status) => updateConversationStatus(db, conversationId, status),
    addInternalNote: (conversationId, body) => addInternalNote(db, conversationId, body),
    createFollowUpTask: (conversation, title) =>
      createFollowUpTask(db, {
        brandId: conversation.brandId as BrandId,
        contactId: conversation.contactId,
        conversationId: conversation.id,
        title: title || 'Follow up with customer',
        priority: conversation.priority,
        notes: 'Created from the QL-004 local API facade.'
      }),
    importDatabase: (rawJson) => importHubDb(rawJson)
  };
}
