import { $, busy, message, pageUrl, navigate } from './ui.js';
$('#togglePassword').addEventListener('click', () => {
  const visible = $('#password').type === 'password';
  $('#password').type = visible ? 'text' : 'password';
  $('#togglePassword').textContent = visible ? 'Hide' : 'Show';
  $('#togglePassword').setAttribute('aria-pressed', String(visible));
  $('#togglePassword').setAttribute(
    'aria-label',
    visible ? 'Hide password' : 'Show password',
  );
});
let pending = false;
$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (pending) return;
  pending = true;
  message($('#loginError'), '');
  message($('#resetNotice'), '');
  $('#forgotPassword').disabled = true;
  busy($('#loginButton'), true, 'Signing in…');
  try {
    const { auth, signInWithEmailAndPassword, isOwner, signOut } =
      await import('./firebase.js');
    const credential = await signInWithEmailAndPassword(
      auth,
      $('#email').value.trim(),
      $('#password').value,
    );
    if (!isOwner(credential.user)) {
      await signOut(auth);
      message($('#loginError'), 'This account does not have owner access.');
      return;
    }
    const destination =
      new URLSearchParams(location.search).get('next') === 'admin'
        ? 'admin.html'
        : 'index.html';
    await navigate(pageUrl(destination), { replace: true });
  } catch (error) {
    const errors = {
      'auth/too-many-requests':
        'Too many attempts. Please wait a moment before trying again.',
      'auth/network-request-failed':
        'We couldn’t connect. Check your connection and try again.',
    };
    message(
      $('#loginError'),
      errors[error.code] ||
        'We couldn’t sign you in. Check your email and password and try again.',
    );
  } finally {
    pending = false;
    busy($('#loginButton'), false, 'Sign in to my studio');
    $('#forgotPassword').disabled = false;
  }
});

$('#forgotPassword').addEventListener('click', async () => {
  if (pending) return;
  const email = $('#email');
  message($('#loginError'), '');
  message($('#resetNotice'), '');
  if (!email.value.trim()) {
    message(
      $('#loginError'),
      'Enter your account email above to reset your password.',
    );
    email.focus();
    return;
  }
  if (!email.checkValidity()) {
    message($('#loginError'), 'Enter a valid email address.');
    email.reportValidity();
    return;
  }
  pending = true;
  $('#loginButton').disabled = true;
  busy($('#forgotPassword'), true, 'Sending reset link...');
  const sentMessage =
    'If this email belongs to an account, a password reset link has been sent. Check your inbox and spam folder.';
  try {
    const { auth, sendPasswordResetEmail } = await import('./firebase.js');
    await sendPasswordResetEmail(auth, email.value.trim());
    message($('#resetNotice'), sentMessage);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      message($('#resetNotice'), sentMessage);
    } else {
      const errors = {
        'auth/too-many-requests':
          'Too many requests. Please wait a moment before trying again.',
        'auth/network-request-failed':
          'We could not connect. Check your connection and try again.',
        'auth/invalid-email': 'Enter a valid email address.',
      };
      message(
        $('#loginError'),
        errors[error.code] ||
          'We could not send a reset link. Please try again.',
      );
    }
  } finally {
    pending = false;
    $('#loginButton').disabled = false;
    busy($('#forgotPassword'), false, 'Forgot password?');
  }
});
