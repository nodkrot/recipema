import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
  query
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// User functions
export async function getUser(id) {
  const userDocRef = doc(db, "users", id);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data();
  }

  return null;
}

export async function upsertUser(user) {
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, user, { merge: true });

  return user;
}

// Recipe functions
export async function getRecipeById(id) {
  const recipeDocRef = doc(db, "recipes", id);
  const recipeDoc = await getDoc(recipeDocRef);

  if (recipeDoc.exists()) {
    return Object.assign({ id: recipeDoc.id }, recipeDoc.data());
  }

  return null;
}

export async function getRecipes() {
  const recipesRef = collection(db, "recipes");
  const q = query(recipesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const recipes = [];

  querySnapshot.forEach((recipeDoc) => {
    recipes.push(Object.assign({ id: recipeDoc.id }, recipeDoc.data()));
  });

  return recipes;
}

export async function createRecipe(recipe) {
  const newRecipe = Object.assign({}, recipe, {
    createdAt: new Date().toISOString(),
    authorId: auth.currentUser.uid
  });
  const recipesRef = collection(db, "recipes");
  const recipeRef = await addDoc(recipesRef, newRecipe);

  return Object.assign({ id: recipeRef.id }, newRecipe);
}

export async function updateRecipe(id, recipe) {
  const recipeDocRef = doc(db, "recipes", id);
  await setDoc(
    recipeDocRef,
    Object.assign({}, recipe, {
      updatedAt: new Date().toISOString()
    }),
    { merge: true }
  );

  return Object.assign({ id }, recipe);
}

export function deleteRecipe(id) {
  const recipeDocRef = doc(db, "recipes", id);
  return deleteDoc(recipeDocRef);
}

// Image functions
export async function createImage(image) {
  const fileName = `${image.uid}.${image.name.split(".").pop()}`;
  const storageRef = ref(storage, `images/${fileName}`);

  const snapshot = await uploadBytes(storageRef, image.originFileObj, {
    cacheControl: "public,max-age=720"
  });

  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    uid: image.uid,
    name: fileName,
    url: downloadURL
  };
}

export function deleteImage(image) {
  const imageRef = ref(storage, `images/${image.name}`);
  return deleteObject(imageRef);
}

export default app;
