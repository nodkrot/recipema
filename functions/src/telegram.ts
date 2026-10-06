// Minimal Telegram Bot API types + client (no extra dependencies).

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

// Bot API 7.0+: describes where a forwarded message originally came from.
export type TgMessageOrigin =
  | { type: "user"; date: number; sender_user: TgUser }
  | { type: "hidden_user"; date: number; sender_user_name: string }
  | { type: "chat"; date: number; sender_chat: TgChat; author_signature?: string }
  | { type: "channel"; date: number; chat: TgChat; message_id: number; author_signature?: string };

export interface TgMessage {
  message_id: number;
  date: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  caption?: string;
  forward_origin?: TgMessageOrigin;
  photo?: TgPhotoSize[];
  video?: unknown;
  voice?: unknown;
  audio?: unknown;
  sticker?: { emoji?: string };
  document?: { file_id: string; file_unique_id: string; file_name?: string; mime_type?: string; file_size?: number };
  location?: { latitude: number; longitude: number };
  contact?: { first_name: string; phone_number: string };
  reply_to_message?: TgMessage;
  /** Buttons under the message (present on the bot's own messages when they're replied to). */
  reply_markup?: { inline_keyboard?: TgKeyboard };
  /** Sent in a group when Telegram upgrades it to a supergroup, which gets a new chat ID. */
  migrate_to_chat_id?: number;
}

export interface TgPhotoSize {
  file_id: string;
  /** Same for the same file everywhere, including when forwarded. */
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

/** A tap on an inline button under one of the bot's messages. */
export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

/** Rows of inline buttons: callback_data comes back in a TgCallbackQuery (max 64 bytes); url opens a link. */
export type TgButton = { text: string; callback_data: string } | { text: string; url: string };
export type TgKeyboard = TgButton[][];

const MAX_MESSAGE_LENGTH = 4000; // Telegram's hard limit is 4096

export class Telegram {
  constructor(private readonly token: string) {}

  async call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; result: T; description?: string };
    if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
    return data.result;
  }

  /** Sends plain text (no parse_mode, so user content can't break formatting). Splits long text. */
  async sendMessage(chatId: number, text: string, replyTo?: number, keyboard?: TgKeyboard): Promise<void> {
    const chunks = splitText(text || "(empty)", MAX_MESSAGE_LENGTH);
    for (let i = 0; i < chunks.length; i++) {
      await this.call("sendMessage", {
        chat_id: chatId,
        text: chunks[i],
        ...(i === 0 && replyTo
          ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } }
          : {}),
        // Buttons go under the last chunk.
        ...(i === chunks.length - 1 && keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
      });
    }
  }

  async editMessageText(chatId: number, messageId: number, text: string, keyboard?: TgKeyboard): Promise<void> {
    await this.call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: splitText(text || "(empty)", MAX_MESSAGE_LENGTH)[0],
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    });
  }

  /** Sends a photo by URL (Telegram fetches it). Caption is plain text, max 1024 characters. */
  async sendPhoto(chatId: number, url: string, caption?: string): Promise<void> {
    await this.call("sendPhoto", { chat_id: chatId, photo: url, ...(caption ? { caption: caption.slice(0, 1024) } : {}) });
  }

  /** Acknowledges a button tap; `text` shows as a small toast in the app. */
  async answerCallbackQuery(id: string, text?: string): Promise<void> {
    await this.call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) }).catch(() => undefined);
  }

  /** Downloads a file the user sent (bots may download files up to 20 MB). */
  async downloadFile(fileId: string): Promise<Buffer> {
    const file = await this.call<{ file_path?: string }>("getFile", { file_id: fileId });
    if (!file.file_path) throw new Error("Telegram returned no file_path");
    const res = await fetch(`https://api.telegram.org/file/bot${this.token}/${file.file_path}`);
    if (!res.ok) throw new Error(`Telegram file download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  private me?: Promise<TgUser>;

  /** The bot's own user (id, username), fetched once per instance. */
  getMe(): Promise<TgUser> {
    this.me ??= this.call<TgUser>("getMe", {});
    return this.me;
  }

  async sendTyping(chatId: number): Promise<void> {
    await this.call("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => undefined);
  }
}

function splitText(text: string, max: number): string[] {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max / 2) cut = max;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  chunks.push(rest);
  return chunks;
}

/**
 * Identifies the original message behind a forward, so the same message forwarded twice
 * (e.g. by both parents) is recognized. Channels have a message ID; for other origins the
 * sender and original send time, plus the content, pin it down.
 */
export function forwardKey(origin: TgMessageOrigin, content: string): string {
  switch (origin.type) {
    case "channel":
      return `channel:${origin.chat.id}:${origin.message_id}`;
    case "user":
      return `user:${origin.sender_user.id}:${origin.date}:${content}`;
    case "hidden_user":
      return `hidden:${origin.sender_user_name}:${origin.date}:${content}`;
    case "chat":
      return `chat:${origin.sender_chat.id}:${origin.date}:${content}`;
  }
}

/** Human-readable description of where a forwarded message came from. */
export function describeOrigin(origin: TgMessageOrigin): string {
  switch (origin.type) {
    case "user": {
      const u = origin.sender_user;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
      return u.username ? `${name} (@${u.username})` : name;
    }
    case "hidden_user":
      return origin.sender_user_name;
    case "chat":
      return origin.sender_chat.title ?? "a group";
    case "channel": {
      const title = origin.chat.title ?? "a channel";
      return origin.author_signature ? `${title} (${origin.author_signature})` : title;
    }
  }
}

export interface TgImage {
  fileId: string;
  uniqueId: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

/** The image attached to a message, if any: a photo, or an image sent as a file. */
export function extractImage(msg: TgMessage): TgImage | null {
  if (msg.photo?.length) {
    // Telegram sends several sizes; the last is the largest. Photos are always JPEG.
    const largest = msg.photo[msg.photo.length - 1];
    return { fileId: largest.file_id, uniqueId: largest.file_unique_id, mediaType: "image/jpeg" };
  }
  const mime = msg.document?.mime_type;
  if (msg.document && mime && IMAGE_TYPES.has(mime)) {
    return {
      fileId: msg.document.file_id,
      uniqueId: msg.document.file_unique_id,
      mediaType: mime as TgImage["mediaType"],
    };
  }
  return null;
}

/** Text content of a message, with a short note for media that has no text. */
export function extractContent(msg: TgMessage): string {
  const text = (msg.text ?? msg.caption ?? "").trim();
  const media: string[] = [];
  if (msg.photo) media.push("[photo]");
  if (msg.video) media.push("[video]");
  if (msg.voice) media.push("[voice message]");
  if (msg.audio) media.push("[audio]");
  if (msg.sticker) media.push(`[sticker ${msg.sticker.emoji ?? ""}]`.trim());
  if (msg.document) media.push(`[file: ${msg.document.file_name ?? msg.document.mime_type ?? "unknown"}]`);
  if (msg.location) media.push(`[location: ${msg.location.latitude}, ${msg.location.longitude}]`);
  if (msg.contact) media.push(`[contact: ${msg.contact.first_name} ${msg.contact.phone_number}]`);
  return [media.join(" "), text].filter(Boolean).join("\n");
}
