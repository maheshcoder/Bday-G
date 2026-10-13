import {
  $,
  protectPage,
  pageUrl,
  copyText,
  message,
  celebrate,
  navigate,
} from './ui.js';
import { welcomeUrl } from './model.js';
const input = $('#personName');
input.addEventListener('input', () => {
  $('#previewName').textContent = input.value.trim() || 'someone special';
  $('#generatedLink').hidden = true;
  message($('#creatorError'), '');
});
$('#creatorForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (!name) {
    message($('#creatorError'), 'Who are we celebrating? Add their name.');
    input.focus();
    return;
  }
  const url = welcomeUrl(name, location.href);
  $('#shareLink').value = url.href;
  $('#openLink').href = url.href;
  $('#generatedLink').hidden = false;
  $('#shareLink').focus();
  celebrate();
});
$('#copyLink').addEventListener('click', () => copyText($('#shareLink').value));
$('#shareButton').addEventListener('click', async () => {
  const url = $('#shareLink').value;
  if (!navigator.share) {
    await copyText(url);
    return;
  }
  try {
    await navigator.share({
      title: 'A birthday surprise for you',
      text: 'A little celebration, just for you.',
      url,
    });
  } catch (error) {
    if (error.name !== 'AbortError') await copyText(url);
  }
});
try {
  if (await protectPage()) {
    const { auth, signOut } = await import('./firebase.js');
    $('#logout').addEventListener('click', async () => {
      try {
        await signOut(auth);
        await navigate(pageUrl('login.html'), { replace: true });
      } catch {
        message(
          $('#creatorError'),
          'We couldn’t sign you out. Please try again.',
        );
      }
    });
  }
} catch {
  $('#authGate').textContent =
    'We couldn’t connect. Please refresh to try again.';
}
