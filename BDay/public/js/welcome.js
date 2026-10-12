import { $, pageUrl } from './ui.js';
import { recipientName } from './model.js';
const name = recipientName(location.search);
$('#recipientName').textContent = name || 'someone special';
const wish = pageUrl('wish.html');
if (name) wish.searchParams.set('name', name);
$('#enterParty').href = wish.href;
document.title = name
  ? 'Happy birthday, ' + name + ' · Birthday Studio'
  : 'A birthday surprise · Birthday Studio';
