const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Adjust path to your User model if needed

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback', 
        passReqToCallback: true,
        proxy: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : null;
          if (!email) {
            return done(new Error('No email returned from Google profile'), null);
          }

          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { email: email }
            ]
          });

          if (user) {
            // Existing user: NEVER modify the existing user's role
            let shouldSave = false;
            if (!user.googleId) {
              user.googleId = profile.id;
              shouldSave = true;
            }
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
              shouldSave = true;
            }
            if (shouldSave) {
              await user.save();
            }
            return done(null, user);
          }

          // New user: Extract requested role from OAuth state parameter
          let requestedRole = 'customer';
          if (req && req.query && req.query.state) {
            try {
              const parsed = JSON.parse(req.query.state);
              if (parsed && parsed.role) {
                requestedRole = parsed.role;
              }
            } catch {
              requestedRole = req.query.state;
            }
          }

          const allowedRoles = ['customer', 'user', 'store_owner', 'wholesaler', 'whole_saler', 'home_business'];
          const assignedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'customer';

          // Create new user with the requested role
          user = await User.create({
            googleId: profile.id,
            fullname: profile.displayName || email.split('@')[0],
            email: email,
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
            mobilenumber: null,
            password: null,
            role: assignedRole
          });

          done(null, user);
        } catch (error) {
          console.error('Google Strategy Error:', error);
          done(error, null);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};