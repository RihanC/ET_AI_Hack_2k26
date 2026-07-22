import type { DocumentRecord } from "./types.js";

export interface DocumentStore {
  create(record: DocumentRecord): void;
  get(id: string): DocumentRecord | undefined;
  update(id: string, patch: Partial<DocumentRecord>): void;
  listByConversation(conversationId: string): DocumentRecord[];
  remove(id: string): boolean;
}

class InMemoryDocumentStore implements DocumentStore {
  private documents = new Map<string, DocumentRecord>();

  create(record: DocumentRecord): void {
    this.documents.set(record.id, record);
  }

  get(id: string): DocumentRecord | undefined {
    return this.documents.get(id);
  }

  update(id: string, patch: Partial<DocumentRecord>): void {
    const existing = this.documents.get(id);
    if (!existing) return;
    this.documents.set(id, { ...existing, ...patch });
  }

  listByConversation(conversationId: string): DocumentRecord[] {
    return Array.from(this.documents.values())
      .filter((d) => d.conversationId === conversationId)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  remove(id: string): boolean {
    return this.documents.delete(id);
  }
}

export const documentStore: DocumentStore = new InMemoryDocumentStore();
