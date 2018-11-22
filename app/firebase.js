import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

const config = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  databaseURL: process.env.FB_DATABASE_URL,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGEING_SENDER_ID
}

const db = !firebase.apps.length
  ? firebase.initializeApp(config).firestore()
  : firebase.app().firestore()

db.settings({ timestampsInSnapshots: true })

export function getRecipes() {
  return db.collection('recipes').orderBy('createdAt', 'desc').get()
    .then((querySnapshot) => {
      const recipes = []

      querySnapshot.forEach((doc) => {
        recipes.push(Object.assign(doc.data(), { id: doc.id }))
      })

      return recipes
    })
}

export function createRecipe(recipe) {
  return db.collection('recipes').add(Object.assign(recipe, {
    createdAt: new Date().toISOString(),
    authorId: firebase.auth().currentUser.uid
  }))
}

export function updateRecipe(id, recipe) {
  return db.collection('recipes').doc(id).set(recipe, { merge: true })
}

export function deleteRecipe(id) {
  return db.collection('recipes').doc(id).delete()
}

export default firebase
