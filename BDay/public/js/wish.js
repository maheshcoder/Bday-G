import { $, busy, celebrate, message } from './ui.js';
import { recipientName, validateWish } from './model.js';
const name = recipientName(location.search) || 'Anonymous';
$('#recipientName').textContent = name === 'Anonymous' ? 'birthday star' : name;
let pending = false;
let submitted = false;
let submissionId;
$('#wishForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pending || submitted) return;
  const data = {
    from: name,
    text: $('#wishText').value.trim(),
    gift: $('#giftText').value.trim(),
    address: $('#addressText').value.trim(),
  };
  const validation = validateWish(data);
  message($('#wishError'), validation);
  if (validation) return;
  pending = true;
  busy($('#submitButton'), true, 'Sending your wish…');
  try {
    const { newWishId, saveWish } = await import('./firebase.js');
    // Keep the document ID across retries so an uncertain response cannot create a second wish.
    submissionId ||= newWishId();
    await saveWish(submissionId, data);
    submitted = true;
    $('#wishForm').hidden = true;
    $('#thanksMessage').hidden = false;
    $('#successTitle').focus();
    celebrate();
  } catch {
    message(
      $('#wishError'),
      'Your wish hasn’t been confirmed. Your words are still here — please try again when you’re connected.',
    );
  } finally {
    pending = false;
    busy($('#submitButton'), false, submitted ? 'Wish sent' : 'Send my wish');
  }
});
document.querySelectorAll('[data-gift]').forEach((button) => {
  button.addEventListener('click', () => {
    $('#giftText').value = button.dataset.gift;
    document
      .querySelectorAll('[data-gift]')
      .forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button)),
      );
    $('#giftText').focus();
  });
});
$('#giftText').addEventListener('input', () => {
  document
    .querySelectorAll('[data-gift]')
    .forEach((item) =>
      item.setAttribute(
        'aria-pressed',
        String(item.dataset.gift === $('#giftText').value),
      ),
    );
});
