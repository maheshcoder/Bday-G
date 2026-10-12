export function recipientName(search) {
  // URLSearchParams already decodes percent escapes. Do not decode twice.
  return (new URLSearchParams(search).get('name') || '').trim().slice(0, 120);
}
export function welcomeUrl(name, currentUrl) {
  const url = new URL('welcome.html', currentUrl);
  url.searchParams.set('name', name.trim());
  if (new URL(currentUrl).searchParams.get('emulator') === '1')
    url.searchParams.set('emulator', '1');
  return url;
}
export function dateValue(value) {
  if (!value) return null;
  const date =
    typeof value.toDate === 'function'
      ? value.toDate()
      : value.seconds !== undefined
        ? new Date(value.seconds * 1000)
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function normalizeWish(id, data) {
  return {
    id,
    from: String(data.from ?? data.name ?? 'Anonymous'),
    text: String(data.text ?? data.wish ?? ''),
    gift: String(data.gift ?? ''),
    address: String(data.address ?? ''),
    completed: data.completed === true,
    date: dateValue(data.createdAt ?? data.timestamp),
  };
}
export function filterWishes(wishes, search, status) {
  const query = search.trim().toLocaleLowerCase();
  return wishes
    .filter(
      (wish) =>
        (status === 'all' || wish.completed === (status === 'completed')) &&
        [wish.from, wish.text, wish.gift].some((value) =>
          value.toLocaleLowerCase().includes(query),
        ),
    )
    .sort(
      (a, b) =>
        (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
    );
}
export function validateWish({ from, text, gift, address }) {
  if (!from || from.length > 120)
    return 'Please open your birthday link again.';
  if (!text.trim()) return 'Write a little wish before sending.';
  if (!gift.trim()) return 'Tell us what gift would make you smile.';
  if (!address.trim()) return 'Add your location so your gift can find you.';
  if (text.length > 2000 || gift.length > 300 || address.length > 500)
    return 'Please shorten your message to fit the field limits.';
  return '';
}
