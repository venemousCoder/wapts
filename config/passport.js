const LocalStrategy = require('passport-local').Strategy;
const AuthService = require('../services/AuthService');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'loginIdentifier', passwordField: 'password', passReqToCallback: true }, async (req, loginIdentifier, password, done) => {
      try {
        const user = await AuthService.authenticate(loginIdentifier, password);
        
        if (!user) {
          return done(null, false, { message: 'Invalid credentials or account suspended' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
