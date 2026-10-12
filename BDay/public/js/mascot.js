import { characterPose } from './character-poses.js';
import { recipientName } from './model.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const page = location.pathname.split('/').pop() || 'index.html';
const recipient = recipientName(location.search);
const friendlyName =
  Array.from(recipient).slice(0, 40).join('') +
  (Array.from(recipient).length > 40 ? '…' : '');
const greetings = {
  'index.html': 'Who are we celebrating today?',
  'welcome.html': friendlyName
    ? `Hey, ${friendlyName}! Ready for a little birthday magic?`
    : 'Hey, birthday star! Ready for a little magic?',
  'wish.html': "Let's make a lovely wish.",
  'login.html': "Let's open your studio of joy.",
  'admin.html': 'Every wish deserves a little magic.',
};
const idleMessage = greetings[page] || 'A little magic, just for you.';
const tasks = new Map();
let controller;
let mood = 'loading';
let resetTimer;
let playTimer;
let helloCount = 0;
let userPaused = false;
try {
  userPaused = sessionStorage.getItem('birthday-motion') === 'paused';
} catch {}
let inView = true;
let navigating = false;
let disposed = false;
const events = new AbortController();
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
const mount = document.querySelector('[data-companion-slot]');
const dock = element('section', 'mascot-dock');
dock.dataset.layout = mount?.dataset.companionLayout || 'inline';
dock.id = 'birthdayMascot';
dock.setAttribute('aria-label', 'Your chibi birthday companion');
dock.dataset.mood = mood;
const visual = element('div', 'companion-visual');
const stage = element('button', 'mascot-stage');
stage.type = 'button';
stage.setAttribute('aria-label', 'Say hello to your birthday companion');
stage.setAttribute('aria-describedby', 'mascotMessage');
const fallback = element('span', 'mascot-fallback');
fallback.setAttribute('aria-hidden', 'true');
const sprite = element('span', 'chibi-sprite');
fallback.append(sprite);
function applyExpression(state) {
  const pose = characterPose(state);
  dock.dataset.expression = pose.name;
  sprite.style.backgroundPosition = pose.backgroundPosition;
}
applyExpression(mood);
stage.append(fallback);
const copy = element('div', 'mascot-copy');
const chapter = element(
  'span',
  'mascot-name',
  page === 'welcome.html'
    ? 'Your birthday, together'
    : 'A little help, a little joy',
);
copy.append(chapter);
const speech = element('p', 'mascot-message', 'A little magic is loading...');
speech.id = 'mascotMessage';
speech.setAttribute('role', 'status');
speech.setAttribute('aria-live', 'polite');
speech.setAttribute('aria-atomic', 'true');
const actions = element('div', 'companion-actions');
const highFive = element('button', 'companion-play', 'High five');
highFive.id = 'companionHighFive';
highFive.setAttribute('aria-label', 'High five');
highFive.type = 'button';
const helpButton = element('button', 'companion-help');
helpButton.id = 'companionHelp';
helpButton.type = 'button';
const motionButton = element('button', 'mascot-motion');
const motionIcon = element('span', 'motion-icon', 'Ⅱ');
motionIcon.setAttribute('aria-hidden', 'true');
const motionLabel = element('span', 'motion-label', 'Pause motion');
motionButton.append(motionIcon, motionLabel);
motionButton.type = 'button';
motionButton.setAttribute('aria-pressed', 'false');
copy.append(speech);
const sparkles = element('span', 'companion-sparkles', '✦ ♡ ✦');
sparkles.setAttribute('aria-hidden', 'true');
visual.append(
  stage,
  sparkles,
  element('span', 'companion-tap-hint', 'Tap me to say hello'),
);
actions.append(highFive, helpButton, motionButton);
dock.append(visual, copy, actions);
const progress = element('div', 'companion-progress');
progress.setAttribute('role', 'group');
progress.setAttribute('aria-label', 'Your wish progress');
const wishSteps = [
  ['wishText', 'Wish'],
  ['giftText', 'Gift'],
  ['addressText', 'Location'],
];
const progressItems = wishSteps.map(([, label], index) =>
  element('span', '', index + 1 + ' ' + label),
);
progress.append(...progressItems);
if (page === 'wish.html') dock.append(progress);
if (mount) mount.append(dock);
else document.querySelector('main')?.prepend(dock);

function isCelebrating() {
  return (
    page === 'wish.html' &&
    document.querySelector('#thanksMessage')?.hidden === false
  );
}
function syncActions() {
  const blocked = navigating || tasks.size > 0;
  highFive.disabled = helpButton.disabled = stage.disabled = blocked;
  if (page === 'wish.html') {
    const complete = wishSteps.map(([id]) =>
      Boolean(document.getElementById(id)?.value.trim()),
    );
    const next = complete.findIndex((value) => !value);
    progressItems.forEach((item, index) => {
      item.dataset.complete = String(complete[index]);
      item.setAttribute(
        'aria-label',
        wishSteps[index][1] + (complete[index] ? ' complete' : ' still needed'),
      );
    });
    progress.hidden = isCelebrating();
    chapter.textContent = isCelebrating()
      ? 'A wish worth celebrating'
      : next < 0
        ? '3 / 3 Ready to send'
        : next +
          1 +
          ' / 3 ' +
          ['Make a wish', 'Pick a gift', 'Add your location'][next];
    helpButton.textContent = isCelebrating()
      ? "Let's celebrate"
      : next < 0
        ? 'Review my wish'
        : ["Let's start", 'Choose a gift', 'Add my location'][next];
  } else {
    helpButton.textContent =
      {
        'welcome.html': 'Make a wish together',
        'index.html': "Let's create a surprise",
        'login.html': 'Help me sign in',
        'admin.html': 'Find a wish',
      }[page] || 'Say hello';
  }
}
function fieldMessage(field) {
  if (field.type === 'password' || field.id === 'password')
    return "I'll close my eyes. Your password is private.";
  return (
    {
      wishText: field.value.trim()
        ? 'Lovely wish. You can make it as big or little as you like.'
        : 'What would make this year feel special? Tell me your wish.',
      giftText: field.value.trim()
        ? 'That sounds lovely! Add your location and we are nearly there.'
        : 'A book, a little adventure, a treat? What would you love?',
      addressText: field.value.trim()
        ? 'Your location stays private with the celebration owner.'
        : 'Add your location so your gift can find you.',
      personName: field.value.trim()
        ? 'Someone special is about to get a lovely surprise.'
        : 'Who are we celebrating? Start with their name.',
      email: 'Use the email for your celebration studio.',
      wishSearch: 'Search by a name, a wish, or a gift.',
    }[field.id] || 'Tell me a little more.'
  );
}
function showFieldReaction(field) {
  if (field.getAttribute('aria-invalid') === 'true') {
    setMood(
      'error',
      field.id === 'addressText'
        ? 'Add your location before sending.'
        : 'A little detail is missing.',
      { duration: 0 },
    );
    return;
  }
  setMood(
    field.type === 'password' || field.id === 'password' ? 'shy' : 'curious',
    fieldMessage(field),
    { duration: 0 },
  );
}
function playReaction(nextMood, text) {
  if (tasks.size || navigating) return;
  setMood(nextMood, text, { duration: 3200 });
  dock.classList.remove('is-playing');
  // Restart the short celebration on each deliberate tap.
  void stage.offsetWidth;
  dock.classList.add('is-playing');
  clearTimeout(playTimer);
  playTimer = setTimeout(() => dock.classList.remove('is-playing'), 1100);
}
stage.addEventListener(
  'click',
  () => {
    const reactions = [
      [
        'delighted',
        friendlyName
          ? `Hi, ${friendlyName}! This is your little moment of joy.`
          : 'Hi there! This is your little moment of joy.',
      ],
      ['playful', 'Okay, one tiny pout… now make me smile with a high five!'],
      ['affection', 'Sending a little birthday love your way.'],
      ['highfive', 'You made me smile! Here is a high five back.'],
    ];
    const [expression, text] = reactions[helloCount++ % reactions.length];
    playReaction(expression, text);
  },
  { signal: events.signal },
);
highFive.addEventListener(
  'click',
  () =>
    playReaction('highfive', 'High five! A little birthday joy, just for you.'),
  { signal: events.signal },
);
helpButton.addEventListener(
  'click',
  () => {
    if (tasks.size || navigating) return;
    if (isCelebrating()) {
      playReaction(
        'highfive',
        'Your wish is on its way. Now let us celebrate you!',
      );
      return;
    }
    if (page === 'welcome.html') {
      document.querySelector('#enterParty')?.click();
      return;
    }
    let field;
    if (page === 'wish.html') {
      field = wishSteps
        .map(([id]) => document.getElementById(id))
        .find((input) => !input.value.trim());
      if (!field) {
        setMood(
          'delighted',
          'Everything is ready. Send your wish whenever you are happy with it.',
        );
        document.getElementById('submitButton')?.focus();
        return;
      }
    } else {
      field = document.getElementById(
        {
          'index.html': 'personName',
          'login.html': 'email',
          'admin.html': 'wishSearch',
        }[page],
      );
    }
    if (field) {
      field.focus();
      showFieldReaction(field);
      field.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  },
  { signal: events.signal },
);
syncActions();
// Keep visual order and keyboard order identical when the welcome layout stacks.
const welcomeVisual = document.querySelector('.welcome-visual');
const welcomeCopy = document.querySelector('.welcome-copy');
if (welcomeVisual && welcomeCopy) {
  const desktopPosition = document.createComment('Welcome character position');
  welcomeVisual.before(desktopPosition);
  const compactWelcome = matchMedia('(max-width: 640px)');
  const syncWelcomeLayout = () => {
    if (compactWelcome.matches)
      welcomeCopy.querySelector('h1').after(welcomeVisual);
    else desktopPosition.after(welcomeVisual);
  };
  compactWelcome.addEventListener('change', syncWelcomeLayout, {
    signal: events.signal,
  });
  syncWelcomeLayout();
}

export function setMood(nextMood, text, { duration = 4200 } = {}) {
  if (disposed || (navigating && nextMood !== 'navigating')) return;
  clearTimeout(resetTimer);
  mood = nextMood;
  dock.dataset.mood = mood;
  applyExpression(mood);
  if (isCelebrating() && dock.dataset.layout !== 'celebration') {
    dock.dataset.layout = 'celebration';
    mount.classList.add('companion-complete');
    document.getElementById('thanksMessage').prepend(mount);
  }
  syncActions();
  if (speech.textContent !== text) speech.textContent = text;
  controller?.setMood(mood);
  if (duration && !['idle', 'loading', 'navigating'].includes(mood)) {
    resetTimer = setTimeout(() => {
      if (tasks.size)
        setMood('loading', Array.from(tasks.values()).at(-1), { duration: 0 });
      else restingMood();
    }, duration);
  }
}

function restingMood() {
  if (isCelebrating()) {
    setMood('success', 'Your wish is on its way. Enjoy your birthday!', {
      duration: 0,
    });
    return;
  }
  const field = document.activeElement;
  if (!field?.matches('input:not([readonly]),textarea')) {
    setMood('idle', idleMessage, { duration: 0 });
    return;
  }
  if (field.getAttribute('aria-invalid') === 'true') {
    setMood(
      'error',
      field.id === 'addressText'
        ? 'Add your location before sending.'
        : 'A little detail is missing.',
      { duration: 0 },
    );
    return;
  }
  showFieldReaction(field);
}

export function setTask(key, pending, text) {
  if (pending) {
    tasks.set(key, text);
    setMood('loading', text, { duration: 0 });
  } else {
    tasks.delete(key);
    if (mood === 'loading') {
      if (tasks.size)
        setMood('loading', Array.from(tasks.values()).at(-1), { duration: 0 });
      else restingMood();
    }
  }
  syncActions();
}
function syncMotion() {
  const paused = userPaused || reducedMotion.matches;
  dock.dataset.motion = paused ? 'paused' : 'running';
  dock.classList.toggle('motion-paused', paused);
  document.documentElement.classList.toggle('motion-paused', paused);
  motionLabel.textContent = paused ? 'Resume motion' : 'Pause motion';
  motionIcon.textContent = paused ? '▷' : 'Ⅱ';
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.disabled = reducedMotion.matches;
  if (reducedMotion.matches) {
    motionLabel.textContent = 'Reduced motion on';
  }
  motionButton.setAttribute('aria-label', motionLabel.textContent);
  motionButton.title = motionLabel.textContent;
  controller?.setPaused(paused);
}
motionButton.addEventListener(
  'click',
  () => {
    userPaused = !userPaused;
    try {
      sessionStorage.setItem(
        'birthday-motion',
        userPaused ? 'paused' : 'running',
      );
    } catch {}
    syncMotion();
  },
  { signal: events.signal },
);
reducedMotion.addEventListener('change', syncMotion, { signal: events.signal });
syncMotion();
const viewport = window.visualViewport;
if (viewport && mount) {
  const syncViewport = () => {
    mount.dataset.compactViewport = String(
      viewport.height < innerHeight * 0.75,
    );
  };
  viewport.addEventListener('resize', syncViewport, {
    signal: events.signal,
  });
  syncViewport();
}
const setup = Symbol('scene');
setTask(setup, true, 'A little magic is loading...');
async function initializeScene() {
  try {
    const { createMascotScene } =
      await import('../assets/vendor/mascot-scene.bundle.js');
    if (disposed) return;
    controller = await createMascotScene(
      stage,
      new URL('../assets/chibi/expressions.webp', import.meta.url).href,
    );
    if (disposed) {
      controller.destroy();
      return;
    }
    fallback.hidden = true;
    dock.dataset.renderMode = 'webgl';
    controller.setMood(mood);
    controller.setVisible(inView && !document.hidden);
    syncMotion();
    controller.canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        controller.setVisible(false);
        controller.canvas.hidden = true;
        fallback.hidden = false;
        dock.dataset.renderMode = 'fallback';
      },
      { signal: events.signal },
    );
    controller.canvas.addEventListener(
      'webglcontextrestored',
      () => {
        controller.canvas.hidden = false;
        fallback.hidden = true;
        dock.dataset.renderMode = 'webgl';
        controller.setVisible(inView && !document.hidden);
      },
      { signal: events.signal },
    );
  } catch {
    dock.dataset.renderMode = 'fallback';
  } finally {
    setTask(setup, false);
  }
}
initializeScene();
const visibility = new IntersectionObserver((entries) => {
  inView = entries[0].isIntersecting;
  controller?.setVisible(inView && !document.hidden);
});
visibility.observe(stage);
document.addEventListener(
  'visibilitychange',
  () => controller?.setVisible(inView && !document.hidden),
  { signal: events.signal },
);
document.addEventListener(
  'pointermove',
  (event) => {
    if (
      reducedMotion.matches ||
      userPaused ||
      document.hidden ||
      !inView ||
      event.pointerType === 'touch'
    )
      return;
    controller?.setLook(
      Math.max(-1, Math.min(1, (event.clientX / innerWidth) * 2 - 1)),
      Math.max(-1, Math.min(1, 1 - (event.clientY / innerHeight) * 2)),
    );
  },
  { passive: true, signal: events.signal },
);
document.addEventListener(
  'focusin',
  (event) => {
    const field = event.target;
    if (
      tasks.size ||
      navigating ||
      !field.matches('input:not([readonly]),textarea')
    )
      return;
    syncActions();
    showFieldReaction(field);
    if (page === 'wish.html') {
      requestAnimationFrame(() => {
        if (document.activeElement !== field || !inView) return;
        const fieldTop = field.getBoundingClientRect().top;
        const companionBottom = mount.getBoundingClientRect().bottom;
        if (
          getComputedStyle(mount).position === 'sticky' &&
          fieldTop < companionBottom + 12
        )
          field.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    }
  },
  { signal: events.signal },
);
document.addEventListener(
  'input',
  (event) => {
    if (!event.target.matches('input,textarea')) return;
    syncActions();
    event.target.removeAttribute('aria-invalid');
    if (!tasks.size && !navigating && event.target.type !== 'password') {
      showFieldReaction(event.target);
    }
  },
  { signal: events.signal },
);
document.addEventListener(
  'invalid',
  (event) => {
    event.target.setAttribute('aria-invalid', 'true');
    setMood(
      'error',
      event.target.id === 'addressText'
        ? 'Add your location before sending.'
        : 'A little detail is missing.',
    );
  },
  { capture: true, signal: events.signal },
);

export async function navigateTo(url, { replace = false } = {}) {
  if (navigating) return;
  navigating = true;
  setMood('navigating', 'On our way to a little more magic...', {
    duration: 0,
  });
  document.documentElement.classList.add('is-navigating');
  if (!reducedMotion.matches && !userPaused)
    await new Promise((resolve) => setTimeout(resolve, 260));
  if (replace) location.replace(url);
  else location.assign(url);
}
document.addEventListener(
  'click',
  (event) => {
    const link = event.target.closest('a[href]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    )
      return;
    const url = new URL(link.href, location.href);
    if (
      url.origin !== location.origin ||
      url.protocol !== location.protocol ||
      !/\.html$/.test(url.pathname)
    )
      return;
    if (url.pathname === location.pathname && url.search === location.search)
      return;
    event.preventDefault();
    navigateTo(url.href);
  },
  { signal: events.signal },
);
// Tilt the existing artwork as a physical card, with no per-frame layout reads.
for (const art of document.querySelectorAll(
  '.art-panel, .welcome-art, .login-art',
)) {
  art.classList.add('depth-art');
  art.addEventListener(
    'pointermove',
    (event) => {
      if (reducedMotion.matches || userPaused || event.pointerType === 'touch')
        return;
      const bounds = art.getBoundingClientRect();
      art.style.setProperty(
        '--tilt-x',
        ((0.5 - (event.clientY - bounds.top) / bounds.height) * 7).toFixed(2) +
          'deg',
      );
      art.style.setProperty(
        '--tilt-y',
        (((event.clientX - bounds.left) / bounds.width - 0.5) * 9).toFixed(2) +
          'deg',
      );
    },
    { passive: true, signal: events.signal },
  );
  art.addEventListener(
    'pointerleave',
    () => {
      art.style.setProperty('--tilt-x', '0deg');
      art.style.setProperty('--tilt-y', '0deg');
    },
    { signal: events.signal },
  );
}
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  navigating = false;
  document.documentElement.classList.remove('is-navigating');
  disposed = false;
  controller?.setVisible(inView && !document.hidden);
  setMood('idle', idleMessage, { duration: 0 });
});
window.addEventListener('pagehide', (event) => {
  clearTimeout(resetTimer);
  clearTimeout(playTimer);
  if (event.persisted) {
    controller?.setVisible(false);
    return;
  }
  disposed = true;
  visibility.disconnect();
  events.abort();
  controller?.destroy();
});
