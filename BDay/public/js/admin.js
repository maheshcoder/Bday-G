import {
  $,
  protectPage,
  pageUrl,
  message,
  toast,
  busy,
  navigate,
  characterTask,
} from './ui.js';
import { normalizeWish, filterWishes } from './model.js';
let wishes = [];
let status = 'all';
let unsubscribe;
let api;
let deleteId;
let deleteTrigger;
let deleting = false;
let latestError = '';
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function render() {
  $('#statTotal').textContent = wishes.length;
  $('#statPending').textContent = wishes.filter(
    (wish) => !wish.completed,
  ).length;
  $('#statDone').textContent = wishes.filter((wish) => wish.completed).length;
  const filtered = filterWishes(wishes, $('#wishSearch').value, status);
  $('#resultCount').textContent =
    filtered.length + (filtered.length === 1 ? ' wish' : ' wishes');
  $('#wishList').replaceChildren();
  if (!filtered.length) {
    const empty = element('div', 'empty-state');
    empty.append(
      element('span', 'empty-star', '✦'),
      element(
        'h2',
        '',
        wishes.length ? 'No matching wishes' : 'The first wish is on its way',
      ),
      element(
        'p',
        '',
        wishes.length
          ? 'Try another search or filter.'
          : 'Create a birthday link and send someone a little joy.',
      ),
    );
    $('#wishList').append(empty);
  }
  for (const wish of filtered) {
    const card = element(
      'article',
      'wish-card' + (wish.completed ? ' completed' : ''),
    );
    const header = element('div', 'wish-header');
    const badge = element(
      'span',
      'status-badge' + (wish.completed ? ' done' : ''),
      wish.completed ? 'Completed' : 'Pending',
    );
    header.append(element('span', 'wish-recipient', wish.from), badge);
    card.append(
      header,
      element('h2', 'wish-gift', wish.gift),
      element('p', 'wish-message', wish.text),
    );
    if (wish.address)
      card.append(element('p', 'wish-location', 'Location · ' + wish.address));
    card.append(
      element(
        'p',
        'wish-date',
        wish.date
          ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(wish.date)
          : 'Date unavailable',
      ),
    );
    const actions = element('div', 'wish-actions');
    const done = element(
      'button',
      'button small secondary',
      wish.completed ? 'Mark as pending' : 'Mark as completed',
    );
    done.type = 'button';
    done.addEventListener('click', async () => {
      busy(done, true, 'Saving…');
      try {
        await api.setCompleted(wish.id, !wish.completed);
        toast('Wish updated.');
      } catch {
        message(
          $('#dashboardError'),
          'We couldn’t update this wish. Please try again.',
        );
      } finally {
        busy(
          done,
          false,
          wish.completed ? 'Mark as pending' : 'Mark as completed',
        );
      }
    });
    const remove = element('button', 'text-button danger', 'Delete');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Delete wish from ' + wish.from);
    remove.addEventListener('click', () => {
      deleteId = wish.id;
      deleteTrigger = remove;
      $('#deleteRecipient').textContent = wish.from;
      message($('#deleteError'), '');
      $('#confirmModal').showModal();
      $('#cancelDelete').focus();
    });
    actions.append(done, remove);
    card.append(actions);
    $('#wishList').append(card);
  }
}
function load() {
  characterTask('wishes', true, 'Gathering your birthday wishes...');
  unsubscribe?.();
  latestError = '';
  message($('#dashboardError'), '');
  $('#retryLoad').hidden = true;
  $('#wishList').textContent = 'Gathering your birthday wishes…';
  unsubscribe = api.watchWishes(
    (snapshot) => {
      characterTask('wishes', false);
      latestError = '';
      message($('#dashboardError'), '');
      $('#retryLoad').hidden = true;
      wishes = snapshot.docs.map((doc) => normalizeWish(doc.id, doc.data()));
      render();
    },
    (error) => {
      characterTask('wishes', false);
      wishes = [];
      latestError = error.code;
      render();
      $('#wishList').replaceChildren();
      message(
        $('#dashboardError'),
        error.code === 'permission-denied'
          ? 'This account cannot access these wishes.'
          : 'We couldn’t load your wishes. Check your connection and try again.',
      );
      $('#retryLoad').hidden = false;
    },
  );
}
$('#wishSearch').addEventListener('input', () => {
  if (!latestError) render();
});
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    status = button.dataset.filter;
    document
      .querySelectorAll('[data-filter]')
      .forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button)),
      );
    if (!latestError) render();
  });
});
$('#retryLoad').addEventListener('click', load);
$('#cancelDelete').addEventListener('click', () => {
  if (!deleting) $('#confirmModal').close();
});
$('#confirmModal').addEventListener('cancel', (event) => {
  if (deleting) event.preventDefault();
});
$('#confirmModal').addEventListener('close', () => {
  deleteId = null;
  if (deleteTrigger?.isConnected) deleteTrigger.focus();
  else $('#wishSearch').focus();
});
$('#confirmDelete').addEventListener('click', async () => {
  if (!deleteId || deleting) return;
  deleting = true;
  $('#cancelDelete').disabled = true;
  busy($('#confirmDelete'), true, 'Deleting…');
  try {
    await api.removeWish(deleteId);
    $('#confirmModal').close();
    toast('Wish deleted.');
  } catch {
    message(
      $('#deleteError'),
      'We couldn’t delete this wish. Please try again.',
    );
  } finally {
    deleting = false;
    $('#cancelDelete').disabled = false;
    busy($('#confirmDelete'), false, 'Delete wish');
  }
});
window.addEventListener('pagehide', () => unsubscribe?.());
try {
  if (await protectPage()) {
    api = await import('./firebase.js');
    load();
    $('#logout').addEventListener('click', async () => {
      try {
        await api.signOut(api.auth);
        navigate(pageUrl('login.html'), { replace: true });
      } catch {
        message(
          $('#dashboardError'),
          'We couldn’t sign you out. Please try again.',
        );
      }
    });
    api.onAuthStateChanged(api.auth, (user) => {
      if (!api.isOwner(user)) {
        unsubscribe?.();
        navigate(pageUrl('login.html'), { replace: true });
      }
    });
  }
} catch {
  $('#authGate').textContent =
    'We couldn’t connect. Please refresh to try again.';
}
