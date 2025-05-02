import { initializeApp } from "firebase/app";
import { getAuth, } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  orderBy,
  deleteDoc,
  query,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  databaseURL: process.env.FB_DATABASE_URL,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGEING_SENDER_ID
};

firebase.apps.length ? firebase.app() : firebase.initializeApp(config);

export async function getUser(id) {
  const doc = await db.collection("users").doc(id).get();

  if (doc.exists) {
    return doc.data();
  }

  return null;
}

export async function upsertUser(user) {
  await db.collection("users").doc(user.uid).set(user, { merge: true });

  return user;
}

export async function getRecipeById(id) {
  const doc = await db.collection("recipes").doc(id).get();

  if (doc.exists) {
    return Object.assign({ id: doc.id }, doc.data());
  }

  return null;
}

export async function getRecipes() {
  const querySnapshot = await db.collection("recipes").orderBy("createdAt", "desc").get();
  const recipes = [];

  querySnapshot.forEach((recipeDoc) => {
    recipes.push(Object.assign({ id: recipeDoc.id }, recipeDoc.data()));
  });

  return recipes;
}

export async function createRecipe(recipe) {
  const newRecipe = Object.assign({}, recipe, {
    createdAt: new Date().toISOString(),
    authorId: firebase.auth().currentUser.uid
  });
  const recipeRef = await db.collection("recipes").add(newRecipe);

  return Object.assign({ id: recipeRef.id }, newRecipe);
}

export async function updateRecipe(id, recipe) {
  await db
    .collection("recipes")
    .doc(id)
    .set(
      Object.assign({}, recipe, {
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );

  return Object.assign({ id }, recipe);
}

export function deleteRecipe(id) {
  return db.collection("recipes").doc(id).delete();
}

export async function createImage(image) {
  const fileName = `${image.uid}.${image.name.split(".").pop()}`;
  const snapshot = await store
    .ref(`images/${fileName}`)
    .put(image.originFileObj, { cacheControl: "public,max-age=720" });
  const downloadURL = await snapshot.ref.getDownloadURL();

  return {
    uid: image.uid,
    name: snapshot.metadata.name,
    url: downloadURL
  };
}

export function deleteImage(image) {
  return store.ref(`images/${image.name}`).delete();
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const store = firebase.storage();

export default firebase;
