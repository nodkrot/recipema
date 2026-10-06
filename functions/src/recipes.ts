// Recipes in Firestore: the same `recipes` collection the portal reads and writes.
//
// Layout:
//   recipes/{autoId}              a recipe (shape below, matches app/utilities/firebase.js)
//   images/{uid}.{ext} (Storage)  gallery photos, same place the portal uploads to
//   recipes/{id}/history/{autoId} fields as they were before a bot edit, so it can be undone
//   botDrafts/{autoId}            a new recipe, edit, or photo the bot proposed, waiting for "Сохранить" (TTL on expireAt)
//   botChats/{chatId}             per-chat state: the recipe last shown, for "this recipe"
//   processedUpdates/{updateId}   de-duplication of Telegram retries (TTL on expireAt)

import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export interface Ingredient {
  name?: string;
  amount?: { value?: string; unit?: string };
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients?: Ingredient[];
  directions?: { text: string }[];
  tags?: string[];
  /** IDs of other recipes that go well with this one. */
  pairings?: string[];
  gallery?: { uid: string; name: string; url: string }[];
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
}

/** Units the portal's form offers (app/components/Ingredients.js), with its Russian labels. */
export const UNITS: Record<string, string> = {
  piece: "шт.",
  tablespoon: "ст. ложка",
  teaspoon: "ч. ложка",
  cup: "стакан",
  pinch: "щепотка",
  clove: "долька",
  kilogram: "килограм",
  gram: "грамм",
  milligram: "миллиграмм",
  liter: "литр",
  milliliter: "миллилитр",
  taste: "по вкусу",
};

/** The fields a bot edit may change. */
export type RecipeChanges = Partial<Pick<Recipe, "name" | "description" | "ingredients" | "directions" | "tags">>;
export const EDITABLE_FIELDS = ["name", "description", "ingredients", "directions", "tags"] as const;

const db = () => getFirestore();

// The whole collection is small (tens of recipes), so it's loaded at once and kept briefly per
// instance; a request that arrives right after a portal edit may see data up to this old.
const CACHE_MS = 30_000;
let cache: { at: number; recipes: Promise<Recipe[]> } | null = null;

/** All recipes, newest first (same order as the portal). */
export function allRecipes(): Promise<Recipe[]> {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    const recipes = db()
      .collection("recipes")
      .orderBy("createdAt", "desc")
      .get()
      .then((snap) => snap.docs.map((d) => ({ ...(d.data() as Omit<Recipe, "id">), id: d.id })));
    recipes.catch(() => (cache = null));
    cache = { at: Date.now(), recipes };
  }
  return cache.recipes;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const doc = await db().collection("recipes").doc(id).get();
  return doc.exists ? { ...(doc.data() as Omit<Recipe, "id">), id: doc.id } : null;
}

/**
 * Cleans changes the way the portal's recipeSanitizer does: trimmed text, no empty ingredients
 * or steps, units only from UNITS, and amounts as plain numbers (the portal's amount field is a
 * number input, so "1/2" would show up blank there).
 */
export function sanitizeChanges(changes: RecipeChanges): RecipeChanges {
  const out: RecipeChanges = {};
  if (changes.name !== undefined) out.name = changes.name.trim();
  if (changes.description !== undefined) out.description = changes.description.trim();
  if (changes.tags) out.tags = [...new Set(changes.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (changes.directions) {
    out.directions = changes.directions.map((d) => ({ text: (d.text ?? "").trim() })).filter((d) => d.text);
  }
  if (changes.ingredients) {
    out.ingredients = changes.ingredients
      .map((i) => {
        let name = (i.name ?? "").trim();
        let value = numericAmount(String(i.amount?.value ?? ""));
        if (value === null) {
          // Not a plain number ("3-4", "пол"): keep it in the name rather than lose it.
          name = `${name} (${String(i.amount!.value).trim()})`;
          value = "";
        }
        const unit = i.amount?.unit && UNITS[i.amount.unit] ? i.amount.unit : "";
        if (!name && !value) return null;
        return {
          ...(name ? { name } : {}),
          ...(value || unit ? { amount: { ...(value ? { value } : {}), ...(unit ? { unit } : {}) } } : {}),
        };
      })
      .filter((i): i is Ingredient => i !== null);
  }
  if (out.name === "") delete out.name; // a recipe always keeps a name
  return out;
}

/** An amount as a plain number string: "1,5" -> "1.5", "1/2" -> "0.5", "" -> ""; null if it isn't a number. */
function numericAmount(raw: string): string | null {
  const v = raw.trim().replace(",", ".");
  if (!v || /^\d+(\.\d+)?$/.test(v)) return v;
  const fraction = /^(\d+)\/(\d+)$/.exec(v);
  if (fraction && Number(fraction[2]) > 0) return String(Math.round((Number(fraction[1]) / Number(fraction[2])) * 100) / 100);
  return null;
}

/** First letter upper-cased, like the recipes typed on the portal ("батон режем" -> "Батон режем"). */
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("ru") + s.slice(1);

/** A new recipe as the portal would store it: sanitized, with names and steps capitalized. */
export function sanitizeNewRecipe(recipe: NewRecipe): NewRecipe {
  const clean = sanitizeChanges(recipe);
  return {
    ...clean,
    name: capitalize(recipe.name.trim()),
    ingredients: (clean.ingredients ?? []).map((i) => (i.name ? { ...i, name: capitalize(i.name) } : i)),
    directions: (clean.directions ?? []).map((d) => ({ text: capitalize(d.text) })),
  };
}

/** A new recipe's fields (a name is required). */
export type NewRecipe = RecipeChanges & { name: string };

interface DraftBase {
  userId: number;
  by: string;
}

/** A change the bot proposed, waiting for "Сохранить". */
export type Draft =
  | (DraftBase & {
      kind: "edit";
      recipeId: string;
      changes: RecipeChanges;
      /** The recipe's updatedAt when the edit was proposed; saving fails if it changed since. */
      baseUpdatedAt: string | null;
    })
  | (DraftBase & {
      kind: "create";
      recipe: NewRecipe;
      /** Telegram file of a dish photo to put in the gallery when saving. */
      photoFileId: string | null;
    })
  | (DraftBase & { kind: "photo"; recipeId: string; photoFileId: string });

const drafts = () => db().collection("botDrafts");

export async function saveDraft(draft: Draft): Promise<string> {
  const ref = await drafts().add({
    ...draft,
    createdAt: FieldValue.serverTimestamp(),
    expireAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000),
  });
  return ref.id;
}

export async function getDraft(id: string): Promise<Draft | null> {
  const doc = await drafts().doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return { kind: "edit", ...data } as Draft; // drafts made before "kind" existed were all edits
}

/** Replaces a draft's content after the user asked for corrections. */
export async function replaceDraft(id: string, draft: Draft): Promise<void> {
  await drafts().doc(id).set({ ...draft, expireAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000) });
}

export async function deleteDraft(id: string): Promise<void> {
  await drafts().doc(id).delete();
}

export type GalleryImage = NonNullable<Recipe["gallery"]>[number];

/**
 * Uploads a photo to images/ like the portal does (app/utilities/firebase.js createImage), with a
 * download token so the URL works the same way as the portal's.
 */
export async function uploadPhoto(bytes: Buffer, mediaType: string): Promise<GalleryImage> {
  const uid = `tg-${randomUUID()}`;
  const ext = mediaType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const name = `${uid}.${ext}`;
  const token = randomUUID();
  const bucket = getStorage().bucket();
  await bucket.file(`images/${name}`).save(bytes, {
    contentType: mediaType,
    metadata: { cacheControl: "public,max-age=720", metadata: { firebaseStorageDownloadTokens: token } },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`images/${name}`)}?alt=media&token=${token}`;
  return { uid, name, url };
}

async function deletePhotos(images: GalleryImage[]): Promise<void> {
  const bucket = getStorage().bucket();
  await Promise.all(images.map((g) => bucket.file(`images/${g.name}`).delete({ ignoreNotFound: true })));
}

export type ApplyResult =
  | { ok: true; recipeId: string; historyId?: string }
  | { ok: false; reason: "missing" | "changed" | "done" };

/**
 * Applies a draft in one transaction. Edits and photos keep the old values in history so they can
 * be undone; an edit is refused if the recipe changed (e.g. on the portal) after it was proposed.
 * `photo` is the draft's photo, already uploaded; `authorId` is the portal uid new recipes get.
 */
export async function applyDraft(
  draftId: string,
  draft: Draft,
  photo: GalleryImage | null,
  authorId: string,
): Promise<ApplyResult> {
  const draftRef = drafts().doc(draftId);
  const result = await db().runTransaction(async (tx): Promise<ApplyResult> => {
    if (!(await tx.get(draftRef)).exists) return { ok: false, reason: "done" };
    const now = new Date().toISOString();

    if (draft.kind === "create") {
      const recipeRef = db().collection("recipes").doc();
      tx.create(recipeRef, {
        description: "",
        ingredients: [],
        directions: [],
        tags: [],
        pairings: [],
        ...draft.recipe,
        gallery: photo ? [photo] : [],
        createdAt: now,
        authorId: authorId || `telegram:${draft.userId}`,
        addedVia: "telegram",
      });
      tx.delete(draftRef);
      return { ok: true, recipeId: recipeRef.id };
    }

    const recipeRef = db().collection("recipes").doc(draft.recipeId);
    const snap = await tx.get(recipeRef);
    if (!snap.exists) return { ok: false, reason: "missing" };
    const current = snap.data() as Omit<Recipe, "id">;
    let changes: Record<string, unknown>;
    if (draft.kind === "edit") {
      if ((current.updatedAt ?? null) !== draft.baseUpdatedAt) return { ok: false, reason: "changed" };
      changes = draft.changes;
    } else {
      changes = { gallery: [...(current.gallery ?? []), photo] };
    }
    const before = Object.fromEntries(Object.keys(changes).map((k) => [k, current[k as keyof typeof current] ?? null]));
    const historyRef = recipeRef.collection("history").doc();
    tx.set(historyRef, { before, after: changes, by: draft.by, userId: draft.userId, at: now, source: "telegram" });
    tx.update(recipeRef, { ...changes, updatedAt: now });
    tx.delete(draftRef);
    return { ok: true, recipeId: recipeRef.id, historyId: historyRef.id };
  });
  cache = null;
  // The photo was uploaded before the transaction; drop it if nothing ended up using it.
  if (!result.ok && photo) await deletePhotos([photo]).catch(() => undefined);
  return result;
}

/** Deletes a recipe the bot just added, with its photos, unless someone has edited it since. */
export async function undoCreate(recipeId: string): Promise<"ok" | "missing" | "changed"> {
  const recipeRef = db().collection("recipes").doc(recipeId);
  const result = await db().runTransaction(async (tx) => {
    const snap = await tx.get(recipeRef);
    if (!snap.exists) return { status: "missing" as const };
    if (snap.get("updatedAt")) return { status: "changed" as const };
    tx.delete(recipeRef);
    return { status: "ok" as const, gallery: (snap.get("gallery") ?? []) as GalleryImage[] };
  });
  cache = null;
  if (result.status === "ok") await deletePhotos(result.gallery).catch(() => undefined);
  return result.status;
}

/** Puts back the fields a bot edit changed, unless the recipe was edited again since. */
export async function undoEdit(recipeId: string, historyId: string): Promise<"ok" | "missing" | "changed"> {
  const recipeRef = db().collection("recipes").doc(recipeId);
  const historyRef = recipeRef.collection("history").doc(historyId);
  const result = await db().runTransaction(async (tx) => {
    const [recipe, history] = await Promise.all([tx.get(recipeRef), tx.get(historyRef)]);
    if (!recipe.exists || !history.exists || history.get("undoneAt")) return "missing" as const;
    if (recipe.get("updatedAt") !== history.get("at")) return "changed" as const;
    const before = history.get("before") as Record<string, unknown>;
    const restore = Object.fromEntries(Object.entries(before).map(([k, v]) => [k, v ?? FieldValue.delete()]));
    const at = new Date().toISOString();
    tx.update(recipeRef, { ...restore, updatedAt: at });
    tx.update(historyRef, { undoneAt: at });
    // Photos the edit added and the undo takes away.
    const kept = new Set(((before.gallery ?? []) as GalleryImage[]).map((g) => g.name));
    const added = ((history.get("after.gallery") ?? []) as GalleryImage[]).filter((g) => !kept.has(g.name));
    return { status: "ok" as const, added };
  });
  cache = null;
  if (result === "missing" || result === "changed") return result;
  await deletePhotos(result.added).catch(() => undefined);
  return result.status;
}

/** Remembers the recipe last shown in a chat, so "этот рецепт" can refer to it. */
export async function setLastRecipe(chatId: number, recipeId: string): Promise<void> {
  await db().collection("botChats").doc(String(chatId)).set({ lastRecipeId: recipeId, at: FieldValue.serverTimestamp() }, { merge: true });
}

export async function getLastRecipe(chatId: number): Promise<string | null> {
  const doc = await db().collection("botChats").doc(String(chatId)).get();
  return (doc.get("lastRecipeId") as string | undefined) ?? null;
}

/** Tags in use with how many recipes have each, most used first. */
export function tagCounts(recipes: Recipe[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of recipes) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"));
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/** Drops a Russian ending so "курица" also finds "курицы" and "куриной". */
const stem = (w: string) => (w.length > 5 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w);

// Fields searched by /find, most telling first: a hit in the name outranks one in the steps.
const SEARCH_FIELDS: [weight: number, text: (r: Recipe) => string[]][] = [
  [8, (r) => [r.name ?? ""]],
  [4, (r) => r.tags ?? []],
  [2, (r) => (r.ingredients ?? []).map((i) => i.name ?? "")],
  [1, (r) => [r.description ?? "", ...(r.directions ?? []).map((d) => d.text ?? "")]],
];

/**
 * Keyword search, best matches first: every word of the query must appear somewhere in the recipe
 * ("курица рис"), ignoring word endings. Typos and "something sweet" are left to Gemini.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const words = normalize(query).split(/\s+/).filter(Boolean).map(stem);
  if (!words.length) return [];
  return recipes
    .map((r) => {
      const fields = SEARCH_FIELDS.map(([weight, text]) => [weight, normalize(text(r).join("\n"))] as const);
      let score = 0;
      for (const w of words) {
        const hits = fields.filter(([, text]) => text.includes(w)).map(([weight]) => weight);
        if (!hits.length) return { r, score: 0 };
        score += Math.max(...hits);
      }
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

/** Records a Telegram update ID; returns false if it was already handled (Telegram retried it). */
export async function claimUpdate(updateId: number): Promise<boolean> {
  try {
    await db()
      .collection("processedUpdates")
      .doc(String(updateId))
      .create({
        at: FieldValue.serverTimestamp(),
        expireAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000),
      });
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 6) return false; // ALREADY_EXISTS
    throw err;
  }
}
