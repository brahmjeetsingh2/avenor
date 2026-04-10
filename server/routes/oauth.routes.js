const express  = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User.model');
const router   = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const toOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const parseClientOrigins = () => {
  const fromCsv = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((item) => toOrigin(item.trim()))
    .filter(Boolean);
  const fromSingle = toOrigin(process.env.CLIENT_URL) || toOrigin(CLIENT_URL);
  return Array.from(new Set([fromSingle, ...fromCsv].filter(Boolean)));
};

const configuredClientOrigins = parseClientOrigins();

const getOrigin = (value) => {
  return toOrigin(value);
};

const isAllowedClientUrl = (origin) => {
  const normalizedOrigin = toOrigin(origin);
  if (!normalizedOrigin) return false;
  if (configuredClientOrigins.includes(normalizedOrigin)) return true;
  try {
    const { protocol, hostname } = new URL(normalizedOrigin);
    if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const resolveClientUrl = (req) => {
  const fromQuery = getOrigin(req.query.client_url);
  if (isAllowedClientUrl(fromQuery)) return fromQuery;

  const fromReferer = getOrigin(req.get('referer'));
  if (isAllowedClientUrl(fromReferer)) return fromReferer;

  return configuredClientOrigins[0] || CLIENT_URL;
};

const encodeState = (payload) => {
  try {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  } catch {
    return '';
  }
};

const decodeState = (state) => {
  if (!state) return {};
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

// ─── Configure strategy (only if credentials present) ─────────────────────────
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name:       profile.displayName,
            email,
            password:   require('crypto').randomBytes(32).toString('hex'), // unusable random password
            role:       'student',
            profilePic: profile.photos?.[0]?.value || '',
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try { done(null, await User.findById(id)); } catch (e) { done(e); }
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const clientUrl = resolveClientUrl(req);
  const state = encodeState({ clientUrl });
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    // If callback is opened directly (no code), restart OAuth flow from the proper entrypoint.
    if (!req.query.code) {
      return res.redirect('/api/auth/google');
    }
    next();
  },
  (req, res, next) => {
    const state = decodeState(req.query.state);
    const stateClient = getOrigin(state.clientUrl);
    const redirectClient = isAllowedClientUrl(stateClient)
      ? stateClient
      : (configuredClientOrigins[0] || CLIENT_URL);

    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        return res.redirect(`${redirectClient}/login?error=oauth`);
      }

      const accessToken  = jwt.sign(
        { id: user._id, role: user.role, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token
      await User.findByIdAndUpdate(user._id, { refreshToken }).catch(() => {});

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });

      const dashboards = { student: '/student/dashboard', coordinator: '/coordinator/dashboard', alumni: '/alumni/dashboard' };
      const dest = dashboards[user.role] || '/';
      return res.redirect(`${redirectClient}/oauth-callback?token=${accessToken}&redirect=${dest}`);
    })(req, res, next);
  }
);

module.exports = router;
