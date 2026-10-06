// Update routing: auth, de-duplication, commands, button taps, free-form requests.

import { logger } from "firebase-functions";
import { Telegram, TgCallbackQuery, TgKeyboard, TgMessage, TgUpdate, extractContent, extractImage } from "./telegram";
import { ImageInput, LlmConfig, editRecipe, extractRecipe, understand } from "./llm";
import * as recipes from "./recipes";
import { EDITABLE_FIELDS, UNITS, type Draft, type Recipe, type RecipeChanges } from "./recipes";

export interface BotConfig {
  botToken: string;
  /** Owners from config (ALLOWED_USER_IDS): always allowed, can't be removed from the bot. */
  allowedUserIds: Set<number>;
  llm: LlmConfig;
  /** Portal address without a trailing slash, e.g. https://recipema.appletreelabs.com */
  portalUrl: string;
  /** Telegram user ID -> portal user uid, the authorId of recipes they add (else "telegram:<user id>"). */
  authorIds: Map<number, string>;
}

const PAGE_SIZE = 10;

const HELP = `Я бот семейной книги рецептов.

Чтобы добавить рецепт, пришлите его текстом, перешлите сообщение с ним
или сфотографируйте страницу из книги или карточку.

Чтобы добавить фото блюда, ответьте фотографией на карточку рецепта.

Найти рецепт – просто напишите, что ищете:
• «что приготовить из фарша?»
• «что-нибудь на десерт»
• «сколько соли в борще?»

Чтобы изменить рецепт, ответьте на его карточку или пришлите ссылку на него:
• «разбей приготовление на шаги»
• «муки нужно 350 г»
• «добавь тег выпечка»
Я покажу, что получится, и сохраню только после «Сохранить».

Команды:
/find <слово> – поиск по названию, ингредиентам и тегам
/list – все рецепты
/tags – рецепты по тегам
/random – случайный рецепт
/users – у кого есть доступ (/adduser, /removeuser)

В группе: упомяните меня или ответьте на моё сообщение.`;

export async function handleUpdate(update: TgUpdate, cfg: BotConfig): Promise<void> {
  const tg = new Telegram(cfg.botToken);
  if (update.callback_query) {
    await handleCallback(tg, cfg, update.update_id, update.callback_query);
    return;
  }
  const msg = update.message;
  if (!msg) return;

  const userId = msg.from?.id;
  if (!userId || !(await isAllowed(cfg, userId))) {
    if (msg.chat.type === "private") {
      await tg.sendMessage(
        msg.chat.id,
        `Это закрытый бот семейной книги рецептов. Ваш Telegram ID: ${userId}.\n\n` +
          `Чтобы получить доступ, попросите кого-нибудь из семьи отправить мне:\n/adduser ${userId} ${msg.from?.first_name ?? ""}`.trim(),
      );
    }
    return;
  }

  if (!(await recipes.claimUpdate(update.update_id))) {
    logger.info("Skipping duplicate update", { updateId: update.update_id });
    return;
  }

  try {
    const text = (msg.text ?? "").trim();
    if (text.startsWith("/")) {
      await handleCommand(tg, cfg, msg, text);
    } else if (msg.chat.type === "private" || (await isAddressedToBot(tg, msg))) {
      const draftId = draftIdOf(msg.reply_to_message);
      if (draftId && msg.text) await reviseDraft(tg, cfg, msg, draftId);
      else if (extractImage(msg) || msg.forward_origin) await handleMedia(tg, cfg, msg);
      else await handleRequest(tg, cfg, msg);
    }
  } catch (err) {
    logger.error("Failed to handle update", err);
    await tg.sendMessage(msg.chat.id, "Что-то пошло не так. Попробуйте ещё раз.", msg.message_id);
  }
}

async function isAllowed(cfg: BotConfig, userId: number): Promise<boolean> {
  return cfg.allowedUserIds.has(userId) || (await recipes.botUsers()).some((u) => u.id === userId);
}

/** In groups, plain text is only answered when it mentions the bot or replies to one of its messages. */
async function isAddressedToBot(tg: Telegram, msg: TgMessage): Promise<boolean> {
  const me = await tg.getMe();
  if (msg.reply_to_message?.from?.id === me.id) return true;
  const text = msg.text ?? msg.caption ?? "";
  return !!me.username && text.toLowerCase().includes(`@${me.username.toLowerCase()}`);
}

/** Finds the recipe in a portal link, e.g. https://recipema.appletreelabs.com/recipe/<id>. */
function recipeIdInText(text: string): string | null {
  return /\/recipe\/([A-Za-z0-9]{10,40})/.exec(text)?.[1] ?? null;
}

/**
 * The recipe a message is about: a portal link in it, else the card it replies to, else the
 * recipe last shown in this chat.
 */
async function currentRecipeId(msg: TgMessage, content: string): Promise<string | null> {
  return recipeIdInText(content) ?? cardRecipeId(msg.reply_to_message) ?? (await recipes.getLastRecipe(msg.chat.id));
}

/** The recipe of a card the bot sent: its "Открыть на сайте" button links to it. */
function cardRecipeId(msg: TgMessage | undefined): string | null {
  for (const row of msg?.reply_markup?.inline_keyboard ?? []) {
    for (const button of row) {
      const id = "url" in button ? recipeIdInText(button.url) : null;
      if (id) return id;
    }
  }
  return null;
}

/** The draft behind a preview the bot sent: its "Сохранить" button carries the draft ID. */
function draftIdOf(msg: TgMessage | undefined): string | null {
  for (const row of msg?.reply_markup?.inline_keyboard ?? []) {
    for (const button of row) {
      if ("callback_data" in button && button.callback_data.startsWith("s:")) return button.callback_data.slice(2);
    }
  }
  return null;
}

function senderName(msg: TgMessage): string {
  return msg.from?.first_name ?? "Telegram";
}

/** Free-form messages: Gemini finds recipes and answers about them, or proposes an edit to one. */
async function handleRequest(tg: Telegram, cfg: BotConfig, msg: TgMessage): Promise<void> {
  const content = extractContent(msg);
  if (!content) return;
  const replyTo = msg.chat.type === "private" ? undefined : msg.message_id;
  await tg.sendTyping(msg.chat.id);
  const [all, currentId] = await Promise.all([recipes.allRecipes(), currentRecipeId(msg, content)]);
  const byId = new Map(all.map((r) => [r.id, r]));
  const current = currentId ? (byId.get(currentId) ?? null) : null;
  const intent = await understand(cfg.llm, all, current, content);

  if (intent.kind === "create") {
    await createFromMessage(tg, cfg, msg);
    return;
  }

  if (intent.kind === "find") {
    const found = intent.recipeIds.map((id) => byId.get(id)!);
    const reply = intent.text || (found.length ? "Вот что нашлось:" : "Ничего не нашлось.");
    await tg.sendMessage(msg.chat.id, reply, replyTo, recipeButtons(found));
    return;
  }

  // Edit from the stored recipe, not the cached list, so nothing is based on stale data.
  const recipe = await recipes.getRecipe(intent.recipeId);
  if (!recipe) {
    await tg.sendMessage(msg.chat.id, "Этого рецепта больше нет.", replyTo);
    return;
  }
  await tg.sendTyping(msg.chat.id);
  const { changes: raw, summary } = await editRecipe(cfg.llm, recipe, intent.request);
  const changes = withoutUnchanged(recipe, recipes.sanitizeChanges(raw));
  if (!Object.keys(changes).length) {
    await tg.sendMessage(msg.chat.id, `В «${recipe.name}» нечего менять по этой просьбе.`, replyTo);
    return;
  }
  const draft: Draft = {
    kind: "edit",
    recipeId: recipe.id,
    changes,
    baseUpdatedAt: recipe.updatedAt ?? null,
    userId: msg.from!.id,
    by: senderName(msg),
  };
  const draftId = await recipes.saveDraft(draft);
  await sendPreview(tg, msg.chat.id, replyTo, draftId, draft, { name: recipe.name, summary });
}

/** Photos and forwards: a dish photo replying to a recipe card goes to its gallery, anything else is a new recipe. */
async function handleMedia(tg: Telegram, cfg: BotConfig, msg: TgMessage): Promise<void> {
  const image = extractImage(msg);
  const cardId = cardRecipeId(msg.reply_to_message);
  if (image && cardId) {
    const recipe = await recipes.getRecipe(cardId);
    if (!recipe) {
      await tg.sendMessage(msg.chat.id, "Этого рецепта больше нет.", msg.message_id);
      return;
    }
    const draft: Draft = { kind: "photo", recipeId: recipe.id, photoFileId: image.fileId, userId: msg.from!.id, by: senderName(msg) };
    const draftId = await recipes.saveDraft(draft);
    await sendPreview(tg, msg.chat.id, msg.message_id, draftId, draft, { name: recipe.name });
    return;
  }
  await createFromMessage(tg, cfg, msg);
}

/** Pulls a recipe out of the message (text, forward, or photo) and shows it for confirmation. */
async function createFromMessage(tg: Telegram, cfg: BotConfig, msg: TgMessage): Promise<void> {
  const replyTo = msg.message_id;
  const image = extractImage(msg);
  const text = (msg.text ?? msg.caption ?? "").trim();
  await tg.sendTyping(msg.chat.id);
  let imageInput: ImageInput | null = null;
  const [all, bytes] = await Promise.all([recipes.allRecipes(), image ? tg.downloadFile(image.fileId) : null]);
  if (image && bytes) imageInput = { mediaType: image.mediaType, base64: bytes.toString("base64") };

  const extraction = await extractRecipe(cfg.llm, text, imageInput, recipes.tagCounts(all).map(([t]) => t));
  if (!extraction.isRecipe) {
    await tg.sendMessage(
      msg.chat.id,
      "Не нашёл здесь рецепта. Пришлите текст с ингредиентами или шагами, фото страницы с рецептом, " +
        "а фото готового блюда – ответом на карточку рецепта." +
        (msg.forward_origin?.type === "user"
          ? "\n\nЧтобы дать этому человеку доступ к боту, ответьте на пересланное сообщение: /adduser"
          : ""),
      replyTo,
    );
    return;
  }
  const recipe = recipes.sanitizeNewRecipe(extraction.recipe);
  const draft: Draft = {
    kind: "create",
    recipe,
    photoFileId: extraction.photoShowsDish && image ? image.fileId : null,
    userId: msg.from!.id,
    by: senderName(msg),
  };
  const draftId = await recipes.saveDraft(draft);
  await sendPreview(tg, msg.chat.id, replyTo, draftId, draft, { similar: similarRecipes(all, recipe.name) });
}

/** A reply to a preview: apply the corrections to the draft and show it again. */
async function reviseDraft(tg: Telegram, cfg: BotConfig, msg: TgMessage, draftId: string): Promise<void> {
  const draft = await recipes.getDraft(draftId);
  if (!draft || draft.kind === "photo") {
    await tg.sendMessage(msg.chat.id, draft ? "Здесь нечего поправлять: нажмите «Сохранить» или «Отмена»." : "Это уже сохранено или отменено.", msg.message_id);
    return;
  }
  await tg.sendTyping(msg.chat.id);
  let revised: Draft;
  let name: string;
  let summary: string;
  if (draft.kind === "edit") {
    const original = await recipes.getRecipe(draft.recipeId);
    if (!original) {
      await tg.sendMessage(msg.chat.id, "Этого рецепта больше нет.", msg.message_id);
      return;
    }
    const edit = await editRecipe(cfg.llm, { ...original, ...draft.changes }, msg.text!);
    const changes = withoutUnchanged(original, { ...draft.changes, ...recipes.sanitizeChanges(edit.changes) });
    revised = { ...draft, changes };
    name = original.name;
    summary = edit.summary;
  } else {
    const edit = await editRecipe(cfg.llm, { id: "new", ...draft.recipe }, msg.text!);
    const recipe = recipes.sanitizeNewRecipe({ ...draft.recipe, ...edit.changes });
    revised = { ...draft, recipe };
    name = recipe.name;
    summary = edit.summary;
  }
  await recipes.replaceDraft(draftId, revised);
  // The old preview loses its buttons, so only the latest version can be saved.
  await tg.editMessageText(msg.chat.id, msg.reply_to_message!.message_id, `${msg.reply_to_message!.text ?? ""}\n\n⤵️ Исправлено ниже`).catch(() => undefined);
  await sendPreview(tg, msg.chat.id, msg.message_id, draftId, revised, { name, summary });
}

/** Shows a draft with Save / Cancel buttons. */
async function sendPreview(
  tg: Telegram,
  chatId: number,
  replyTo: number | undefined,
  draftId: string,
  draft: Draft,
  info: { name?: string; summary?: string; similar?: Recipe[] },
): Promise<void> {
  const hint = "Чтобы что-то поправить, ответьте на это сообщение.";
  let text: string;
  if (draft.kind === "photo") {
    text = `📷 Добавить это фото в «${info.name}»?`;
  } else if (draft.kind === "edit") {
    if (!Object.keys(draft.changes).length) {
      text = `✏️ ${info.name}\n\nПо сравнению с рецептом ничего не меняется.`;
    } else {
      text = [`✏️ ${info.name}`, info.summary, formatChanges(draft.changes), hint].filter(Boolean).join("\n\n");
    }
  } else {
    const similar = info.similar?.length
      ? `⚠️ Похоже, такой уже есть: ${info.similar.map((r) => `«${r.name}»`).join(", ")}`
      : "";
    const photo = draft.photoFileId ? "📷 Фото блюда добавлю в галерею." : "";
    text = ["🆕 Новый рецепт", info.summary, formatChanges(draft.recipe), photo, similar, hint].filter(Boolean).join("\n\n");
  }
  const keyboard: TgKeyboard = [
    [
      { text: "✅ Сохранить", callback_data: `s:${draftId}` },
      { text: "✖️ Отмена", callback_data: `x:${draftId}` },
    ],
    ...(info.similar ?? []).slice(0, 3).map((r) => [{ text: `👀 ${r.name}`, callback_data: `r:${r.id}` }]),
  ];
  await tg.sendMessage(chatId, text, replyTo, keyboard);
}

const STOP_WORDS = new Set(["для", "из", "по", "на", "с", "со", "и", "в", "без", "домашнему", "рецепт"]);

/** Recipes whose names share most of the significant words with `name`. */
function similarRecipes(all: Recipe[], name: string): Recipe[] {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/ё/g, "е")
        .split(/[^\p{L}]+/u)
        .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
        .map((w) => w.slice(0, Math.max(4, w.length - 2))),
    );
  const target = words(name);
  if (!target.size) return [];
  return all.filter((r) => {
    const other = words(r.name ?? "");
    const common = [...target].filter((w) => other.has(w)).length;
    return common > 0 && common / Math.min(target.size, other.size || 1) >= 0.6;
  });
}

/** Drops fields the edit would leave as they are. */
function withoutUnchanged(recipe: Recipe, changes: RecipeChanges): RecipeChanges {
  return Object.fromEntries(
    Object.entries(changes).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(recipe[k as keyof Recipe] ?? null)),
  );
}

/** The new values of the changed fields, in recipe order. */
function formatChanges(changes: RecipeChanges): string {
  const parts: string[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (changes[field] === undefined) continue;
    switch (field) {
      case "name":
        parts.push(`Название: ${changes.name}`);
        break;
      case "description":
        parts.push(`Описание: ${changes.description || "(пусто)"}`);
        break;
      case "tags":
        parts.push(`Теги: ${changes.tags!.map((t) => `#${hashtag(t)}`).join(" ") || "(нет)"}`);
        break;
      case "ingredients":
        parts.push(`Ингредиенты:\n${formatIngredients(changes.ingredients!)}`);
        break;
      case "directions":
        parts.push(`Приготовление:\n${formatSteps(changes.directions!)}`);
        break;
    }
  }
  return parts.join("\n\n");
}

async function handleCallback(tg: Telegram, cfg: BotConfig, updateId: number, cq: TgCallbackQuery): Promise<void> {
  if (!(await isAllowed(cfg, cq.from.id))) {
    await tg.answerCallbackQuery(cq.id, "Это закрытый бот.");
    return;
  }
  if (!(await recipes.claimUpdate(updateId))) return;
  const chatId = cq.message?.chat.id;
  const data = cq.data ?? "";
  const sep = data.indexOf(":");
  const [action, arg] = [data.slice(0, sep), data.slice(sep + 1)];
  await tg.answerCallbackQuery(cq.id);
  if (!chatId || sep < 0) return;

  try {
    switch (action) {
      case "r": {
        const recipe = await recipes.getRecipe(arg);
        if (recipe) await sendRecipe(tg, cfg, chatId, recipe);
        else await tg.sendMessage(chatId, "Этого рецепта больше нет.");
        return;
      }
      case "p":
        await editListPage(tg, chatId, cq.message!.message_id, Number(arg));
        return;
      case "t":
        await sendTag(tg, chatId, arg);
        return;
      case "s":
        await saveDraft(tg, cfg, chatId, cq.message!.message_id, arg);
        return;
      case "x":
        await recipes.deleteDraft(arg);
        await tg.editMessageText(chatId, cq.message!.message_id, `${cq.message!.text ?? ""}\n\n✖️ Отменено`);
        return;
      case "u": {
        const [recipeId, historyId] = arg.split(":");
        await undo(tg, chatId, cq.message!, recipeId, historyId);
        return;
      }
      case "d":
        await undoCreate(tg, chatId, cq.message!, arg);
        return;
    }
  } catch (err) {
    logger.error("Failed to handle button", err);
    await tg.sendMessage(chatId, "Что-то пошло не так. Попробуйте ещё раз.");
  }
}

async function saveDraft(tg: Telegram, cfg: BotConfig, chatId: number, messageId: number, draftId: string): Promise<void> {
  const draft = await recipes.getDraft(draftId);
  if (!draft) {
    await tg.sendMessage(chatId, "Это уже сохранено или отменено.");
    return;
  }
  const photoFileId = draft.kind === "edit" ? null : draft.photoFileId;
  let photo: recipes.GalleryImage | null = null;
  if (photoFileId) {
    const bytes = await tg.downloadFile(photoFileId);
    photo = await recipes.uploadPhoto(bytes, imageType(bytes));
  }
  const result = await recipes.applyDraft(draftId, draft, photo, cfg.authorIds.get(draft.userId) ?? "");
  if (!result.ok) {
    const why = {
      missing: "Этого рецепта больше нет.",
      changed: "Рецепт успел измениться (например, на сайте), поэтому я ничего не сохранил. Попросите ещё раз.",
      done: "Это уже сохранено или отменено.",
    }[result.reason];
    await tg.sendMessage(chatId, why);
    return;
  }
  const recipe = await recipes.getRecipe(result.recipeId);
  const undoButton =
    draft.kind === "create"
      ? { text: "↩️ Отменить добавление", callback_data: `d:${result.recipeId}` }
      : { text: "↩️ Вернуть как было", callback_data: `u:${result.recipeId}:${result.historyId}` };
  const what = { create: "✅ Добавлено", edit: "✅ Сохранено", photo: "✅ Фото добавлено" }[draft.kind];
  await tg.editMessageText(chatId, messageId, `${what}: ${recipe?.name ?? ""}`, [
    [undoButton],
    [
      { text: "📖 Показать", callback_data: `r:${result.recipeId}` },
      { text: "Открыть на сайте", url: `${cfg.portalUrl}/recipe/${result.recipeId}` },
    ],
  ]);
}

/** An image's type from its first bytes (Telegram photos are JPEG; images sent as files may not be). */
function imageType(bytes: Buffer): string {
  if (bytes.subarray(0, 4).toString("hex") === "89504e47") return "image/png";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (bytes.subarray(0, 3).toString() === "GIF") return "image/gif";
  return "image/jpeg";
}

async function undoCreate(tg: Telegram, chatId: number, msg: TgMessage, recipeId: string): Promise<void> {
  const result = await recipes.undoCreate(recipeId);
  if (result === "ok") {
    await tg.editMessageText(chatId, msg.message_id, `${msg.text ?? ""}\n\n↩️ Удалено`);
  } else if (result === "changed") {
    await tg.sendMessage(chatId, "Рецепт уже изменили после добавления, поэтому удалить его автоматически нельзя.");
  } else {
    await tg.sendMessage(chatId, "Этого рецепта уже нет.");
  }
}

async function undo(tg: Telegram, chatId: number, msg: TgMessage, recipeId: string, historyId: string): Promise<void> {
  const result = await recipes.undoEdit(recipeId, historyId);
  if (result === "ok") {
    await tg.editMessageText(chatId, msg.message_id, `${msg.text ?? ""}\n\n↩️ Возвращено как было`);
  } else if (result === "changed") {
    await tg.sendMessage(chatId, "Рецепт уже изменили после этого, поэтому вернуть автоматически нельзя.");
  } else {
    await tg.sendMessage(chatId, "Это изменение уже отменено.");
  }
}

async function handleCommand(tg: Telegram, cfg: BotConfig, msg: TgMessage, text: string): Promise<void> {
  const [rawCmd] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase(); // handles /cmd@YourBot in groups
  const arg = text.slice(rawCmd.length).trim();
  const chatId = msg.chat.id;

  switch (cmd) {
    case "/start":
    case "/help":
      await tg.sendMessage(chatId, HELP);
      return;

    case "/find": {
      if (!arg) {
        await tg.sendMessage(chatId, "Напишите, что искать: /find борщ");
        return;
      }
      const found = recipes.searchRecipes(await recipes.allRecipes(), arg).slice(0, PAGE_SIZE);
      if (found.length) {
        await tg.sendMessage(chatId, `Найдено по «${arg}»:`, undefined, recipeButtons(found));
      } else {
        // No keyword match: let Gemini try by meaning ("сладкое", "из курицы").
        await handleRequest(tg, cfg, { ...msg, text: arg });
      }
      return;
    }

    case "/list":
      await tg.sendMessage(chatId, ...(await listPage(0)));
      return;

    case "/tags": {
      const tags = recipes.tagCounts(await recipes.allRecipes());
      if (!tags.length) {
        await tg.sendMessage(chatId, "Тегов пока нет.");
        return;
      }
      // callback_data is limited to 64 bytes; a longer tag is still listed in the text.
      const buttons = tags
        .filter(([tag]) => Buffer.byteLength(`t:${tag}`) <= 64)
        .map(([tag, n]) => ({ text: `${tag} (${n})`, callback_data: `t:${tag}` }));
      const rows: TgKeyboard = [];
      for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
      await tg.sendMessage(chatId, "Теги:\n" + tags.map(([t, n]) => `#${hashtag(t)} – ${n}`).join("\n"), undefined, rows);
      return;
    }

    case "/users": {
      const added = await recipes.botUsers();
      const lines = [
        ...[...cfg.allowedUserIds].map((id) => `• ${id} – владелец`),
        ...added
          .filter((u) => !cfg.allowedUserIds.has(u.id))
          .map((u) => `• ${u.name ? `${u.name} (${u.id})` : u.id}${u.addedBy ? ` – добавил(а) ${u.addedBy}` : ""}`),
      ];
      await tg.sendMessage(
        chatId,
        `Доступ к боту:\n${lines.join("\n")}\n\nДобавить: /adduser <ID> [имя]\nУбрать: /removeuser <ID>`,
      );
      return;
    }

    case "/adduser": {
      // Either "/adduser 123 Мама", or a reply to a message forwarded from that person.
      const origin = msg.reply_to_message?.forward_origin;
      const [rawId, ...nameParts] = arg.split(/\s+/);
      let id = Number(rawId);
      let name = nameParts.join(" ");
      if (!rawId && origin?.type === "user") {
        id = origin.sender_user.id;
        name = [origin.sender_user.first_name, origin.sender_user.last_name].filter(Boolean).join(" ");
      }
      if (!Number.isSafeInteger(id) || id <= 0) {
        await tg.sendMessage(
          chatId,
          "Как добавить человека:\n" +
            "• /adduser <ID> [имя] – ID бот показывает тем, у кого нет доступа\n" +
            "• или перешлите сюда сообщение этого человека и ответьте на него: /adduser" +
            (origin && origin.type !== "user" ? "\n\n(У этого сообщения отправитель скрыт настройками приватности – нужен ID.)" : ""),
        );
        return;
      }
      if (cfg.allowedUserIds.has(id) || !(await recipes.addBotUser(id, name, senderName(msg), msg.from!.id))) {
        await tg.sendMessage(chatId, `У ${name || id} уже есть доступ.`);
        return;
      }
      await tg.sendMessage(chatId, `Готово: ${name ? `${name} (${id})` : id} теперь может пользоваться ботом.`);
      return;
    }

    case "/removeuser": {
      const id = Number(arg.split(/\s+/)[0]);
      if (!Number.isSafeInteger(id) || id <= 0) {
        await tg.sendMessage(chatId, "Напишите ID: /removeuser <ID>. Список – /users");
        return;
      }
      if (cfg.allowedUserIds.has(id)) {
        await tg.sendMessage(chatId, "Это владелец, его можно убрать только в настройках бота.");
        return;
      }
      const removed = await recipes.removeBotUser(id);
      await tg.sendMessage(chatId, removed ? `Готово: у ${id} больше нет доступа.` : `${id} нет в списке. Список – /users`);
      return;
    }

    case "/random": {
      const all = await recipes.allRecipes();
      if (!all.length) {
        await tg.sendMessage(chatId, "Рецептов пока нет.");
        return;
      }
      await sendRecipe(tg, cfg, chatId, all[Math.floor(Math.random() * all.length)]);
      return;
    }

    default:
      await tg.sendMessage(chatId, "Неизвестная команда. Попробуйте /help.");
  }
}

/** One button per recipe; tapping it shows the recipe. */
function recipeButtons(list: Recipe[]): TgKeyboard {
  return list.map((r) => [{ text: r.name || "Без названия", callback_data: `r:${r.id}` }]);
}

/** A page of all recipes with ◀ ▶ buttons, as sendMessage arguments after chatId. */
async function listPage(page: number): Promise<[string, undefined, TgKeyboard]> {
  const all = await recipes.allRecipes();
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const p = Math.min(Math.max(0, page), pages - 1);
  const nav = [
    ...(p > 0 ? [{ text: "◀", callback_data: `p:${p - 1}` }] : []),
    ...(p < pages - 1 ? [{ text: "▶", callback_data: `p:${p + 1}` }] : []),
  ];
  const keyboard = [...recipeButtons(all.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)), ...(nav.length ? [nav] : [])];
  return [`Все рецепты (${all.length}), стр. ${p + 1} из ${pages}:`, undefined, keyboard];
}

async function editListPage(tg: Telegram, chatId: number, messageId: number, page: number): Promise<void> {
  const [text, , keyboard] = await listPage(page);
  await tg.editMessageText(chatId, messageId, text, keyboard);
}

async function sendTag(tg: Telegram, chatId: number, tag: string): Promise<void> {
  const list = (await recipes.allRecipes()).filter((r) => r.tags?.includes(tag));
  if (!list.length) {
    await tg.sendMessage(chatId, `С тегом #${hashtag(tag)} рецептов нет.`);
    return;
  }
  await tg.sendMessage(chatId, `#${hashtag(tag)} (${list.length}):`, undefined, recipeButtons(list));
}

/** A recipe in full: photo, ingredients, steps, pairings, and a link to the portal. */
async function sendRecipe(tg: Telegram, cfg: BotConfig, chatId: number, recipe: Recipe): Promise<void> {
  const photo = recipe.gallery?.find((g) => g.url)?.url;
  if (photo) {
    // A broken image shouldn't stop the recipe itself from being sent.
    await tg.sendPhoto(chatId, photo).catch((err) => logger.warn("sendPhoto failed", { id: recipe.id, err: String(err) }));
  }
  const all = await recipes.allRecipes();
  const pairings = (recipe.pairings ?? [])
    .map((id) => all.find((r) => r.id === id))
    .filter((r): r is Recipe => !!r);
  const keyboard: TgKeyboard = [
    ...pairings.map((r) => [{ text: `🍽 ${r.name}`, callback_data: `r:${r.id}` }]),
    [{ text: "Открыть на сайте", url: `${cfg.portalUrl}/recipe/${recipe.id}` }],
  ];
  await tg.sendMessage(chatId, formatRecipe(recipe, pairings), undefined, keyboard);
  await recipes.setLastRecipe(chatId, recipe.id);
}

function formatRecipe(r: Recipe, pairings: Recipe[]): string {
  const parts = [r.name || "Без названия"];
  if (r.description?.trim()) parts.push(r.description.trim());
  if (r.tags?.length) parts.push(r.tags.map((t) => `#${hashtag(t)}`).join(" "));
  const ingredients = (r.ingredients ?? []).filter((i) => i.name || i.amount);
  if (ingredients.length) parts.push(`Ингредиенты:\n${formatIngredients(ingredients)}`);
  const steps = (r.directions ?? []).filter((d) => d.text?.trim());
  if (steps.length) parts.push(`Приготовление:\n${formatSteps(steps)}`);
  if (pairings.length) parts.push(`Подходит к: ${pairings.map((p) => p.name).join(", ")}`);
  return parts.join("\n\n");
}

function formatIngredients(ingredients: NonNullable<Recipe["ingredients"]>): string {
  return ingredients
    .map((i) => {
      const unit = i.amount?.unit;
      const amount = [i.amount?.value, unit ? (UNITS[unit] ?? unit) : ""].filter(Boolean).join(" ");
      return `• ${[i.name, amount].filter(Boolean).join(" – ")}`;
    })
    .join("\n");
}

function formatSteps(steps: { text: string }[]): string {
  return steps.map((d, i) => `${i + 1}. ${d.text.trim()}`).join("\n");
}

function hashtag(tag: string): string {
  return tag.trim().replace(/\s+/g, "_");
}
