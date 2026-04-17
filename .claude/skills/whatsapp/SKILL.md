---
name: whatsapp
description: Building WhatsApp conversation UI — chat views, message history, template pickers, and delivery status indicators. Only use when the app's frontend explicitly displays WhatsApp conversations, message lists, or template management. Do NOT use for apps that only send WhatsApp messages in the background via workflows.
user-invocable: false
---

# WhatsApp UI Skill

Build frontend components for apps with WhatsApp messaging workflows. The backend handles all API calls via workflows — the frontend reads entities, triggers workflows, and displays results.

The frontend NEVER writes to Conversations or Messages entities. Those are managed by backend workflows when messages are sent/received.

## Template Management Is NOT the Frontend's Job by Default

Template names, phone numbers, and variable mappings are configured on the workflow action node — either by the backend agent (which can call `WHATSAPP_GET_PHONE_NUMBERS` and `WHATSAPP_GET_MESSAGE_TEMPLATES` to resolve them) or by the user via the action node's sidebar widgets.

Do NOT build template management UI in the app unless the user explicitly asks for it. Only build in-app template picking/creation if the user insists their end-users need to manage templates from within the app UI.

## Data Sources

- **Conversations entity** — one row per customer: `senderPhone`, `senderName`, `lastMessageAt`, `lastMessageId`, `lastMessageText`, `lastMessageType`, `phoneNumberId`
- **Messages entity** — per-message history: `messageId`, `senderPhone`, `direction` (inbound/outbound), `type`, `body`, `status`, `timestamp`
- **TemplateStatusUpdates entity** — status change log: `templateName`, `templateId`, `event`, `category`, `reason`

Read entities with `useEntityGetAll` / `useEntityGet` from `@blocksdiy/blocks-client-sdk/reactSdk`. For action results, use `useExecuteAction`.

## Sending Messages — 24-Hour Window (UX guidance)

Meta enforces a 24-hour conversation window on the backend — `WHATSAPP_SEND_MESSAGE` only works within 24h of the customer's last inbound message; `WHATSAPP_SEND_TEMPLATE_MESSAGE` works anytime. The backend/Meta API rejects calls that violate this, so the frontend does NOT need to enforce it. However, the UI SHOULD adapt to give a better experience:

For live chat UIs, estimate client-side: `Date.now() - new Date(lastMessageAt).getTime() < 24 * 60 * 60 * 1000`. This is approximate — the backend is the source of truth.

**Within 24h:** Show a text input for free-form messaging. Optionally offer a "use template" button.

**Outside 24h (or no prior conversation):** Disable free-form input. Show: "Messaging window expired. Select an approved template." Display the template picker.

### Starting a New Conversation

When the user messages a contact with no existing Conversations row:

1. Show a phone number input.
2. After entering the number, immediately show the chat panel in a local "pending" state — do not wait for a DB row. Use a synthetic object: `{ senderPhone: enteredNumber, senderName: '', lastMessageAt: null }`.
3. Since no 24h window is open, disable free-form input and show the template picker.
4. After sending the template, the backend workflow creates the Conversations row. Refetch conversations to pick it up.

### Template Picker (for live chat UI only)

Show ALL templates from the "Get Templates" workflow. Only APPROVED ones are selectable — render others disabled with their status badge. Show `name`, `category`, `language`, and BODY text preview. On selection, show a full preview and parameter input fields for any `{{1}}`, `{{2}}` placeholders.

## Message Rendering

The backend workflow saves `body` and `type` to the Messages entity. The frontend renders based on `type`:

```tsx
function renderMessage(msg: IMessagesEntity) {
  switch (msg.type) {
    case 'text':
    case 'template':
      return <p className="whitespace-pre-wrap text-sm">{msg.body}</p>;
    case 'image':
      return msg.mediaUrl ? (
        <img
          src={msg.mediaUrl}
          alt={msg.body || 'Image'}
          className="max-w-[240px] rounded"
        />
      ) : (
        <p className="text-sm italic">{msg.body || '📷 Image'}</p>
      );
    case 'document':
      return <p className="text-sm">📄 {msg.body || 'Document'}</p>;
    case 'audio':
      return <p className="text-sm">🎵 Voice message</p>;
    case 'video':
      return <p className="text-sm">🎬 {msg.body || 'Video'}</p>;
    case 'location':
      return <p className="text-sm">📍 {msg.body || 'Location'}</p>;
    case 'contacts':
      return <p className="text-sm">👤 {msg.body || 'Contact card'}</p>;
    case 'interactive':
    case 'button':
      return <p className="text-sm">{msg.body || 'Interactive message'}</p>;
    case 'reaction':
      return <p className="text-2xl">{msg.body}</p>;
    case 'sticker':
      return <p className="text-sm">Sticker</p>;
    default:
      return <p className="text-sm">{msg.body || '[Unsupported message]'}</p>;
  }
}
```

Template messages display like regular text because the backend reconstructs the body. If `body` is empty for a template message, the workflow has a bug.

## Delivery Status

Show on outbound messages. The `status` field progresses: `sent` → `delivered` → `read` (or `failed`).

- `sent` — single gray checkmark ✓
- `delivered` — double gray checkmarks ✓✓
- `read` — double blue checkmarks ✓✓
- `failed` — red ✗ icon

## Template Management UI (last resort — only if user explicitly insists)

If the user demands end-users manage templates in-app, build a template list (fetch via "Get Templates" workflow) showing `name`, `category`, `language`, status badge (APPROVED green, PENDING yellow, REJECTED red), and BODY preview. Only APPROVED templates are selectable for sending. Optionally include a create form and a status feed from `TemplateStatusUpdates` entity. Refer to the backend WhatsApp instructions for template content rules.

## Formatting

- **Phone numbers**: stored as `14155551234`. Display as `+1 (415) 555-1234`. Show `senderName` alongside.
- **Timestamps**: ISO 8601. Relative for recent ("2 min ago"), absolute for older. In message bubbles, show time only ("2:45 PM").
