import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
const projectId = 'demo-birthday-studio';
let env;
const valid = () => ({
  from: 'Maya',
  text: 'A lovely year',
  gift: 'A book',
  address: 'Bengaluru',
  completed: false,
  createdAt: serverTimestamp(),
});
before(async () => {
  const rules = (await readFile('firestore.rules', 'utf8')).replace(
    /request\.auth\.uid == '[^']*'/,
    "request.auth.uid == 'test-owner'",
  );
  env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules },
  });
});
after(async () => {
  await env.cleanup();
});
test('public may create valid wishes but may not read, update or delete them', async () => {
  const db = env.unauthenticatedContext().firestore();
  const ref = doc(db, 'wishes', 'public-test');
  await assertSucceeds(setDoc(ref, valid()));
  await assertFails(getDoc(ref));
  await assertFails(getDocs(collection(db, 'wishes')));
  await assertFails(updateDoc(ref, { completed: true }));
  await assertFails(deleteDoc(ref));
});
test('rejects malformed public submissions', async () => {
  const db = env.unauthenticatedContext().firestore();
  const cases = [
    { ...valid(), text: '' },
    { ...valid(), gift: 123 },
    { ...valid(), from: 'a'.repeat(121) },
    { ...valid(), address: 'a'.repeat(501) },
    { ...valid(), address: '' },
    { ...valid(), address: '   ' },
    { ...valid(), address: '\t\n' },
    { ...valid(), completed: true },
    { ...valid(), createdAt: new Date() },
    { ...valid(), extra: 'unexpected' },
    { ...valid(), text: 'a'.repeat(2001) },
  ];
  for (let i = 0; i < cases.length; i++)
    await assertFails(setDoc(doc(db, 'wishes', 'invalid-' + i), cases[i]));
});
test('non-owner accounts cannot access wishes', async () => {
  const db = env.authenticatedContext('other-user').firestore();
  await assertFails(getDocs(collection(db, 'wishes')));
  await assertFails(
    updateDoc(doc(db, 'wishes', 'public-test'), { completed: true }),
  );
  await assertFails(deleteDoc(doc(db, 'wishes', 'public-test')));
});
test('owner can read, change status and delete; other fields are immutable', async () => {
  const db = env.authenticatedContext('test-owner').firestore();
  const ref = doc(db, 'wishes', 'public-test');
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(getDocs(collection(db, 'wishes')));
  await assertSucceeds(updateDoc(ref, { completed: true }));
  await assertSucceeds(updateDoc(ref, { completed: false }));
  await assertFails(updateDoc(ref, { text: 'Changed' }));
  await assertFails(updateDoc(ref, { completed: 'yes' }));
  await assertSucceeds(deleteDoc(ref));
});
test('owner can still manage legacy wishes without a location', async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'wishes', 'legacy-location'), {
      from: 'Lina',
      text: 'An old wish',
      gift: 'A book',
      address: '',
      completed: false,
    });
  });
  const ref = doc(
    env.authenticatedContext('test-owner').firestore(),
    'wishes',
    'legacy-location',
  );
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(updateDoc(ref, { completed: true }));
  await assertSucceeds(deleteDoc(ref));
});

test('unconfigured production owner default denies admin access', async () => {
  await env.cleanup();
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: (await readFile('firestore.rules', 'utf8')).replace(
        /request\.auth\.uid == '[^']*'/,
        "request.auth.uid == ''",
      ),
    },
  });
  await assertFails(
    getDocs(
      collection(env.authenticatedContext('test-owner').firestore(), 'wishes'),
    ),
  );
});
