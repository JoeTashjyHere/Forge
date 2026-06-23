import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { isValidMessageBody } from '@/lib/validators';
import type {
  ConversationSummary,
  DirectMessage,
  WorkspaceMessage,
} from '@/types/messaging';

const CONVERSATIONS_KEY = 'forge.conversations';
const MESSAGES_KEY = 'forge.messages';
const WORKSPACE_MSGS_KEY = 'forge.workspaceMessages';

let localSeq = 0;
const localId = (p: string) => `${p}-${Date.now()}-${(localSeq += 1)}`;

interface DemoConv {
  id: string;
  otherUserId: string | null;
  otherName: string;
  otherPhotoUrl: string | null;
}

interface Participant {
  id: string;
  name: string;
  photoUrl?: string | null;
}

interface MessagingState {
  meId: string | null;
  conversations: ConversationSummary[];
  messagesByConversation: Record<string, DirectMessage[]>;
  workspaceByProject: Record<string, WorkspaceMessage[]>;
  conversationsLoaded: boolean;

  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string, userId: string) => Promise<void>;
  startConversation: (userId: string, other: Participant) => Promise<string>;
  sendDirectMessage: (
    conversationId: string,
    senderId: string,
    recipientId: string | null,
    body: string,
  ) => Promise<void>;
  markConversationRead: (conversationId: string, userId: string) => Promise<void>;

  loadWorkspaceMessages: (projectId: string) => Promise<void>;
  sendWorkspaceMessage: (projectId: string, sender: Participant, body: string) => Promise<void>;

  subscribeConversation: (conversationId: string) => () => void;
  subscribeWorkspace: (projectId: string) => () => void;

  totalUnread: () => number;
}

// --- local persistence ----------------------------------------------------
async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}
async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// --- mappers ---------------------------------------------------------------
function mapMessage(r: any): DirectMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    recipientId: r.recipient_id ?? null,
    body: r.message_text ?? '',
    read: Boolean(r.read_status),
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function nameFromRow(u: any): string {
  return (
    u?.display_name ||
    [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
    'Builder'
  );
}

function upsertMessage(list: DirectMessage[], msg: DirectMessage): DirectMessage[] {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg];
}

// --- demo canned replies ---------------------------------------------------
const DEMO_REPLIES = [
  'Hey! Thanks for reaching out — your project looks promising. What are you focused on this week?',
  'I’d love to help. What’s the single biggest thing you’re trying to move forward right now?',
  'Sounds good. Want to set up a quick call to align on scope and next steps?',
  'I can take the first slice of that. Send over the details and I’ll get started.',
];

export const useMessagingStore = create<MessagingState>((set, get) => ({
  meId: null,
  conversations: [],
  messagesByConversation: {},
  workspaceByProject: {},
  conversationsLoaded: false,

  // -------------------------------------------------------------------------
  loadConversations: async (userId) => {
    set({ meId: userId });

    if (isSupabaseConfigured) {
      const { data: mems } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);
      const convIds = (mems ?? []).map((m: any) => m.conversation_id);
      if (convIds.length === 0) {
        set({ conversations: [], conversationsLoaded: true });
        return;
      }
      const [allMembersRes, msgsRes] = await Promise.all([
        supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds),
        supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true }),
      ]);
      const allMembers = (allMembersRes.data ?? []) as any[];
      const otherIds = [
        ...new Set(allMembers.filter((m) => m.user_id !== userId).map((m) => m.user_id)),
      ];
      const userMap = new Map<string, any>();
      if (otherIds.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, profile_photo_url')
          .in('id', otherIds);
        (users ?? []).forEach((u: any) => userMap.set(u.id, u));
      }

      const msgs = (msgsRes.data ?? []).map(mapMessage);
      const byConv: Record<string, DirectMessage[]> = {};
      msgs.forEach((m) => {
        (byConv[m.conversationId] ??= []).push(m);
      });

      const summaries: ConversationSummary[] = convIds.map((cid: string) => {
        const other = allMembers.find((m) => m.conversation_id === cid && m.user_id !== userId);
        const u = other ? userMap.get(other.user_id) : null;
        const group = byConv[cid] ?? [];
        const last = group[group.length - 1];
        return {
          id: cid,
          otherUserId: other?.user_id ?? null,
          otherName: u ? nameFromRow(u) : 'Builder',
          otherPhotoUrl: u?.profile_photo_url ?? null,
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.createdAt ?? null,
          unreadCount: group.filter((m) => m.recipientId === userId && !m.read).length,
        };
      });
      summaries.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
      set({
        conversations: summaries,
        messagesByConversation: byConv,
        conversationsLoaded: true,
      });
      return;
    }

    // Demo mode
    const [demoConvs, msgMap] = await Promise.all([
      readJson<DemoConv[]>(CONVERSATIONS_KEY, []),
      readJson<Record<string, DirectMessage[]>>(MESSAGES_KEY, {}),
    ]);
    const summaries: ConversationSummary[] = demoConvs.map((c) => {
      const group = msgMap[c.id] ?? [];
      const last = group[group.length - 1];
      return {
        id: c.id,
        otherUserId: c.otherUserId,
        otherName: c.otherName,
        otherPhotoUrl: c.otherPhotoUrl,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt ?? null,
        unreadCount: group.filter((m) => m.recipientId === userId && !m.read).length,
      };
    });
    summaries.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
    set({
      conversations: summaries,
      messagesByConversation: msgMap,
      conversationsLoaded: true,
    });
  },

  // -------------------------------------------------------------------------
  loadMessages: async (conversationId, userId) => {
    set({ meId: userId });
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      set((s) => ({
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: (data ?? []).map(mapMessage),
        },
      }));
      return;
    }
    const map = await readJson<Record<string, DirectMessage[]>>(MESSAGES_KEY, {});
    set((s) => ({
      messagesByConversation: {
        ...s.messagesByConversation,
        [conversationId]: map[conversationId] ?? [],
      },
    }));
  },

  // -------------------------------------------------------------------------
  startConversation: async (userId, other) => {
    set({ meId: userId });

    if (isSupabaseConfigured) {
      // Find an existing direct conversation that includes both users.
      const { data: mine } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);
      const myConvIds = (mine ?? []).map((m: any) => m.conversation_id);
      if (myConvIds.length) {
        const { data: shared } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', other.id)
          .in('conversation_id', myConvIds);
        const existing = shared?.[0]?.conversation_id;
        if (existing) {
          await get().loadConversations(userId);
          return existing;
        }
      }
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ conversation_type: 'direct' })
        .select('id')
        .single();
      if (error || !conv) throw error ?? new Error('Could not create conversation');
      // Insert self first (RLS), then the other member.
      await supabase.from('conversation_members').insert({ conversation_id: conv.id, user_id: userId });
      await supabase.from('conversation_members').insert({ conversation_id: conv.id, user_id: other.id });
      await get().loadConversations(userId);
      return conv.id as string;
    }

    // Demo mode — reuse an existing conversation with the same person.
    const demoConvs = await readJson<DemoConv[]>(CONVERSATIONS_KEY, []);
    const existing = demoConvs.find((c) => c.otherUserId === other.id);
    if (existing) {
      await get().loadConversations(userId);
      return existing.id;
    }
    const id = localId('local-c');
    const next: DemoConv[] = [
      { id, otherUserId: other.id, otherName: other.name, otherPhotoUrl: other.photoUrl ?? null },
      ...demoConvs,
    ];
    await writeJson(CONVERSATIONS_KEY, next);
    await get().loadConversations(userId);
    return id;
  },

  // -------------------------------------------------------------------------
  sendDirectMessage: async (conversationId, senderId, recipientId, body) => {
    const trimmed = body.trim();
    if (!isValidMessageBody(trimmed)) return;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          message_text: trimmed,
        })
        .select('*')
        .single();
      if (error || !data) throw error ?? new Error('Send failed');
      applyIncoming(set, get, mapMessage(data));
      return;
    }

    const meId = get().meId ?? senderId;
    const msg: DirectMessage = {
      id: localId('local-m'),
      conversationId,
      senderId,
      recipientId,
      body: trimmed,
      read: true,
      createdAt: new Date().toISOString(),
    };
    applyIncoming(set, get, msg);
    await persistDemoMessages(get);

    // Simulate the other person replying so the flow is testable offline.
    const conv = get().conversations.find((c) => c.id === conversationId);
    const otherId = conv?.otherUserId ?? recipientId;
    if (otherId) {
      const count = (get().messagesByConversation[conversationId] ?? []).length;
      const reply = DEMO_REPLIES[count % DEMO_REPLIES.length]!;
      setTimeout(() => {
        applyIncoming(set, get, {
          id: localId('local-m'),
          conversationId,
          senderId: otherId,
          recipientId: meId,
          body: reply,
          read: false,
          createdAt: new Date().toISOString(),
        });
        void persistDemoMessages(get);
      }, 900);
    }
  },

  // -------------------------------------------------------------------------
  markConversationRead: async (conversationId, userId) => {
    const list = get().messagesByConversation[conversationId] ?? [];
    if (!list.some((m) => m.recipientId === userId && !m.read)) return;
    const updated = list.map((m) =>
      m.recipientId === userId && !m.read ? { ...m, read: true } : m,
    );
    set((s) => ({
      messagesByConversation: { ...s.messagesByConversation, [conversationId]: updated },
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));

    if (isSupabaseConfigured) {
      await supabase
        .from('messages')
        .update({ read_status: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('read_status', false);
      return;
    }
    await persistDemoMessages(get);
  },

  // -------------------------------------------------------------------------
  loadWorkspaceMessages: async (projectId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('workspace_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      const rows = (data ?? []) as any[];
      const senderIds = [...new Set(rows.map((r) => r.sender_id))];
      const userMap = new Map<string, any>();
      if (senderIds.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, profile_photo_url')
          .in('id', senderIds);
        (users ?? []).forEach((u: any) => userMap.set(u.id, u));
      }
      const messages: WorkspaceMessage[] = rows.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        senderId: r.sender_id,
        senderName: nameFromRow(userMap.get(r.sender_id)),
        senderPhotoUrl: userMap.get(r.sender_id)?.profile_photo_url ?? null,
        body: r.message_text ?? '',
        createdAt: r.created_at ?? new Date().toISOString(),
      }));
      set((s) => ({ workspaceByProject: { ...s.workspaceByProject, [projectId]: messages } }));
      return;
    }
    const map = await readJson<Record<string, WorkspaceMessage[]>>(WORKSPACE_MSGS_KEY, {});
    set((s) => ({
      workspaceByProject: { ...s.workspaceByProject, [projectId]: map[projectId] ?? [] },
    }));
  },

  sendWorkspaceMessage: async (projectId, sender, body) => {
    const trimmed = body.trim();
    if (!isValidMessageBody(trimmed)) return;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('workspace_messages')
        .insert({ project_id: projectId, sender_id: sender.id, message_text: trimmed })
        .select('*')
        .single();
      if (error || !data) throw error ?? new Error('Send failed');
      const msg: WorkspaceMessage = {
        id: data.id,
        projectId,
        senderId: sender.id,
        senderName: sender.name,
        senderPhotoUrl: sender.photoUrl ?? null,
        body: trimmed,
        createdAt: data.created_at ?? new Date().toISOString(),
      };
      set((s) => ({
        workspaceByProject: {
          ...s.workspaceByProject,
          [projectId]: upsertWorkspace(s.workspaceByProject[projectId] ?? [], msg),
        },
      }));
      return;
    }

    const msg: WorkspaceMessage = {
      id: localId('local-w'),
      projectId,
      senderId: sender.id,
      senderName: sender.name,
      senderPhotoUrl: sender.photoUrl ?? null,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    const next = [...(get().workspaceByProject[projectId] ?? []), msg];
    set((s) => ({ workspaceByProject: { ...s.workspaceByProject, [projectId]: next } }));
    const map = await readJson<Record<string, WorkspaceMessage[]>>(WORKSPACE_MSGS_KEY, {});
    map[projectId] = next;
    await writeJson(WORKSPACE_MSGS_KEY, map);
  },

  // -------------------------------------------------------------------------
  subscribeConversation: (conversationId) => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => applyIncoming(set, get, mapMessage(payload.new)),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },

  subscribeWorkspace: (projectId) => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel(`workspace:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const r: any = payload.new;
          let name = 'Teammate';
          let photo: string | null = null;
          const { data: u } = await supabase
            .from('users')
            .select('display_name, first_name, last_name, profile_photo_url')
            .eq('id', r.sender_id)
            .maybeSingle();
          if (u) {
            name = nameFromRow(u);
            photo = u.profile_photo_url ?? null;
          }
          const msg: WorkspaceMessage = {
            id: r.id,
            projectId,
            senderId: r.sender_id,
            senderName: name,
            senderPhotoUrl: photo,
            body: r.message_text ?? '',
            createdAt: r.created_at ?? new Date().toISOString(),
          };
          set((s) => ({
            workspaceByProject: {
              ...s.workspaceByProject,
              [projectId]: upsertWorkspace(s.workspaceByProject[projectId] ?? [], msg),
            },
          }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },

  totalUnread: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}));

// --- shared helpers --------------------------------------------------------
function upsertWorkspace(list: WorkspaceMessage[], msg: WorkspaceMessage): WorkspaceMessage[] {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg];
}

/** Adds a message (from send or realtime) and refreshes the conversation summary. */
function applyIncoming(
  set: (fn: (s: MessagingState) => Partial<MessagingState>) => void,
  get: () => MessagingState,
  msg: DirectMessage,
) {
  const meId = get().meId;
  set((s) => {
    const list = upsertMessage(s.messagesByConversation[msg.conversationId] ?? [], msg);
    const existing = s.conversations.find((c) => c.id === msg.conversationId);
    const conversations = existing
      ? s.conversations.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.body,
                lastMessageAt: msg.createdAt,
                unreadCount: list.filter((m) => m.recipientId === meId && !m.read).length,
              }
            : c,
        )
      : s.conversations;
    return {
      messagesByConversation: { ...s.messagesByConversation, [msg.conversationId]: list },
      conversations: [...conversations].sort((a, b) =>
        (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''),
      ),
    };
  });
}

async function persistDemoMessages(get: () => MessagingState) {
  if (isSupabaseConfigured) return;
  await writeJson(MESSAGES_KEY, get().messagesByConversation);
}
