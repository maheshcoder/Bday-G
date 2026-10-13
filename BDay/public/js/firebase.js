import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import { firebaseConfig, OWNER_UID } from './config.js';
const localEmulators =
  ['localhost', '127.0.0.1'].includes(location.hostname) &&
  new URLSearchParams(location.search).get('emulator') === '1';
const config = localEmulators
  ? { ...firebaseConfig, projectId: 'demo-birthday-studio', apiKey: 'demo-key' }
  : firebaseConfig;
const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
if (localEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
export const isOwner = (user) =>
  Boolean(user && OWNER_UID && user.uid === OWNER_UID);
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
};
export const newWishId = () => doc(collection(db, 'wishes')).id;
export const saveWish = (id, data) =>
  setDoc(doc(db, 'wishes', id), {
    ...data,
    completed: false,
    createdAt: serverTimestamp(),
  });
export const watchWishes = (next, error) =>
  onSnapshot(collection(db, 'wishes'), next, error);
export const setCompleted = (id, completed) =>
  updateDoc(doc(db, 'wishes', id), { completed });
export const removeWish = (id) => deleteDoc(doc(db, 'wishes', id));
