import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
export default async function setup() {
  const rules = (await readFile('firestore.rules', 'utf8')).replace(
    /request\.auth\.uid == '[^']*'/,
    "request.auth.uid == 'test-owner'",
  );
  const env = await initializeTestEnvironment({
    projectId: 'demo-birthday-studio',
    firestore: { host: '127.0.0.1', port: 8080, rules },
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'wishes', 'maya'), {
      from: 'Maya',
      text: 'More adventures together',
      gift: 'A weekend away',
      address: 'Bengaluru',
      completed: false,
      createdAt: Timestamp.fromDate(new Date('2026-10-10T09:00:00Z')),
    });
    await setDoc(doc(db, 'wishes', 'lina'), {
      from: 'Lina',
      text: 'A little time to read',
      gift: 'A beautiful book',
      address: '',
      completed: true,
      createdAt: Timestamp.fromDate(new Date('2026-10-09T09:00:00Z')),
    });
    await setDoc(doc(db, 'wishes', 'legacy'), {
      name: "O'Connor",
      wish: 'A legacy wish',
      gift: 'Coffee',
      timestamp: '2025-01-01T09:00:00Z',
    });
  });
  await env.cleanup();
  await fetch(
    'http://127.0.0.1:9099/emulator/v1/projects/demo-birthday-studio/accounts',
    { method: 'DELETE' },
  );
  const importUsers = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-birthday-studio/accounts:batchCreate?key=demo-key',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer owner',
      },
      body: JSON.stringify({
        users: [
          {
            localId: 'test-owner',
            email: 'owner@example.com',
            rawPassword: 'birthday-test-only',
            emailVerified: true,
          },
          {
            localId: 'other-user',
            email: 'other@example.com',
            rawPassword: 'birthday-test-only',
            emailVerified: true,
          },
        ],
      }),
    },
  );
  if (!importUsers.ok)
    throw Error('Cannot seed auth emulator: ' + (await importUsers.text()));
  await mkdir('artifacts/vendor', { recursive: true });
  // Cache the exact production CDN modules for repeatable browser tests.
  for (const product of ['app', 'auth', 'firestore']) {
    const response = await fetch(
      'https://www.gstatic.com/firebasejs/13.0.0/firebase-' + product + '.js',
    );
    if (!response.ok)
      throw Error('Firebase CDN unavailable: ' + response.status);
    await writeFile(
      'artifacts/vendor/firebase-' + product + '.js',
      await response.text(),
    );
  }
}
