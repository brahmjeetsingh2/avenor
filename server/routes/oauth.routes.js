const express  = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User.model');
const router   = express.Router();

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
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const user = req.user;

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
    User.findByIdAndUpdate(user._id, { refreshToken }).catch(() => {});

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with token in URL fragment (never in query string)
    const dashboards = { student: '/student/dashboard', coordinator: '/coordinator/dashboard', alumni: '/alumni/dashboard' };
    const dest = dashboards[user.role] || '/';
    res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}&redirect=${dest}`);
  }
);

module.exports = router;
