# Birthday Studio

A premium playful birthday experience built with static HTML, CSS, JavaScript modules, Firebase Authentication, and Firestore. Existing `welcome.html?name=...` and `wish.html?name=...` links still work.

## Local preview

From this directory:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4177/welcome.html?name=Mahesh to preview the recipient experience, or /login.html for the owner sign-in. The creator and dashboard require owner authentication. No production deployment has been performed.

## Forgotten password

Open /login.html, enter the existing account email, and click **Forgot password?**. Firebase sends a reset link; follow it to choose a new password. The app never stores or displays your password. Resetting a password does not change owner access: the owner UID must still match the site configuration.

## Owner configuration before production use

Set the existing owner's verified Firebase Authentication UID in **both** `public/js/config.js` (`OWNER_UID`) and `firestore.rules` (`isOwner`). The client and rules must use the same owner UID; an empty UID denies administrative access. Firebase client configuration is public project metadata; it is not an authorization mechanism.

Verify the current deployed rules in Firebase Console before deploying this tracked rules file. It allows validated public wish creation and restricts reading/deleting wishes and changing their completion status to that UID. Existing wishes remain readable by the configured owner; no migration is necessary. Legacy `name/wish/timestamp` records also render correctly.

Recipient links contain names, not signed invitation tokens. They can be edited or constructed manually, and public wish creation does not authenticate the recipient. Rules validate data and privacy, but do not provide abuse rate limits. Use an invitation-token backend or App Check as a separate update if stronger controls become necessary.

Production publishing is separate from this implementation.

## Development checks

```sh
npm test
npm run test:rules
npm run test:browser
```

Rules and browser tests use **demo-birthday-studio**, never the production project. Firebase emulators need Java 17 or newer for the pinned Firebase CLI. Browser tests use installed Google Chrome; adjust the Playwright channel if your machine uses a different browser. The browser test server substitutes a test owner UID locally; it does not change the production configuration.

For manual emulator use, start Firebase emulators for `demo-birthday-studio` and add `?emulator=1` to a localhost page URL. The flag is ignored on non-local hosts. The default local preview uses the existing project, so use the emulator flag when testing real submissions.

## Images

Three original illustrations were generated with the built-in image tool and optimized to WebP:

- `public/assets/hero.webp`: ivory sculpted birthday cake, coral candles, lilac gifts, soft studio lighting.
- `public/assets/welcome.webp`: lilac gift with a flowing coral satin ribbon, transparent background.
- `public/assets/success.webp`: open lilac gift, coral ribbon, floating heart and restrained confetti, transparent background.

The exact generation prompts are preserved in `assets-prompts.md`. HTML renders all names and interface text. Fraunces and DM Sans are served locally from public/assets/fonts with their OFL licenses and system serif/sans-serif fallbacks. The illustrations have explicit dimensions and the two cutouts preserve alpha.

## Behavior

Owner-only link creation includes a live greeting preview, copy/share and recipient preview. Public wish submission validates fields, disables repeat submissions, keeps its document ID across retries and preserves inputs on errors. If a connection drops after persistence, a retry may be denied because recipients cannot update existing wishes; the owner dashboard is the source of truth.

The dashboard supports search, pending/completed filters, newest-first sorting, legacy dates, completion toggles and a native accessible delete dialog. Motion respects reduced-motion preferences. Location is required for new wishes and only readable by the configured owner. Blank and whitespace-only locations are rejected by the client and tracked Firestore rules; old wishes remain manageable.

## Chibi character and 3D motion

Your reference-style black-haired chibi companion uses transparent illustrated expression cutouts in a Three.js scene. It gently bobs, tilts toward the pointer, thinks while loading, closes its eyes at password fields, smiles during navigation, and reacts to errors and success. Expression changes crossfade, with occasional blushing while idle. This preserves the supplied illustration style using 3D motion; the character is not a rigged volumetric model. Existing artwork has gentle floating and perspective tilt. The character lives in the main content on every page. On the welcome page it is a large interactive scene, with a tap greeting, high-five action, and a button to start the wish together. The wish form embeds the character as a guide: its help button focuses the next missing field and shows wish/gift/location progress without submitting. It joins the success confirmation after persistence. Mobile layouts put the welcome character between the heading and actions, use compact form guidance, and avoid a sticky guide when the viewport is short or the keyboard is open. All character actions support touch and keyboard, with 44px control targets.

The pause control and reduced-motion preference stop the animation; the same character artwork provides a CSS fallback without WebGL. The pause preference survives navigation. The WebGL renderer stops when the character is offscreen or the page is hidden and disposes its geometry, textures, materials, and graphics context when leaving.

The 12-expression transparent atlas is public/assets/chibi/expressions.webp, with cell metadata in atlas.json. Mood mappings live in public/js/character-poses.js. Editable scene source is public/js/mascot-scene.js. After changing it or its mappings, run npm run assets:3d to rebuild the checked-in local runtime. Run npm run assets:character -- <generated-transparent-atlas.png> to normalize a replacement 3-column, 4-row source atlas. The website itself remains static and needs no build step to serve. Font assets can be refreshed with npm run assets:fonts.
