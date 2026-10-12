import { setMood, setTask, navigateTo } from './mascot.js';
export {
  setMood as characterMood,
  setTask as characterTask,
  navigateTo as navigate,
};
export const $ = (selector) => document.querySelector(selector);
export function pageUrl(page) {
  const url = new URL(page, location.href);
  if (new URLSearchParams(location.search).get('emulator') === '1')
    url.searchParams.set('emulator', '1');
  return url;
}
export function toast(message) {
  const live = $('#toast');
  live.textContent = message;
  live.classList.add('visible');
  setMood('success', message);
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => live.classList.remove('visible'), 3500);
}
export function message(element, text) {
  element.textContent = text;
  element.hidden = !text;
  if (text && element.getAttribute('role') === 'alert') setMood('error', text);
}
export function busy(button, pending, label) {
  button.disabled = pending;
  button.setAttribute('aria-busy', String(pending));
  button.textContent = label;
  setTask(button, pending, label);
}
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Link copied. A little joy, ready to send.');
  } catch {
    const output = $('#shareLink');
    output?.focus();
    output?.select();
    toast('Select and copy the link above.');
  }
}
export function celebrate() {
  setMood('success', 'A little joy, ready to go!');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', Math.random() * 100 + '%');
    piece.style.setProperty('--delay', Math.random() * 0.4 + 's');
    piece.style.setProperty('--turn', Math.random() * 600 - 300 + 'deg');
    piece.style.background = ['#dc604b', '#b8a0d2', '#e1b44a'][i % 3];
    layer.append(piece);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 2400);
}
export async function protectPage() {
  setTask('session', true, 'Opening your studio...');
  let api;
  try {
    api = await import('./firebase.js');
  } catch (error) {
    setTask('session', false);
    setMood('error', 'We could not open your studio. Try again.');
    throw error;
  }
  const { auth, onAuthStateChanged, isOwner } = api;
  return new Promise((resolve) => {
    let unsubscribe;
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe?.();
        setTask('session', false);
        if (!user) {
          const login = pageUrl('login.html');
          login.searchParams.set(
            'next',
            location.pathname.endsWith('admin.html') ? 'admin' : 'creator',
          );
          navigateTo(login, { replace: true });
          resolve(false);
        } else if (!isOwner(user)) {
          $('#authGate').textContent =
            'This account does not have owner access.';
          setMood('error', 'This account cannot open the studio.');
          const signout = document.createElement('button');
          signout.className = 'button secondary';
          signout.textContent = 'Use another account';
          signout.addEventListener('click', async () => {
            try {
              await api.signOut(auth);
              await navigateTo(pageUrl('login.html'), { replace: true });
            } catch {
              setMood('error', 'We could not sign you out. Try again.');
            }
          });
          $('#authGate').append(signout);
          resolve(false);
        } else {
          $('#authGate').hidden = true;
          $('#protectedContent').hidden = false;
          resolve(true);
        }
      },
      () => {
        setTask('session', false);
        $('#authGate').textContent =
          'We could not check your session. Please refresh to try again.';
        setMood('error', 'We could not check your session.');
        resolve(false);
      },
    );
  });
}
document.querySelectorAll('[data-page]').forEach((link) => {
  link.href = pageUrl(link.dataset.page).href;
});
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());
