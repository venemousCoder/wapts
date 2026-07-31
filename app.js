const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');

const env = require('./config/env');

const app = express();

// View Engine
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disabled for dev, configure properly for prod
}));
app.use(compression());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
const store = new MongoDBStore({
  uri: env.MONGO_URI,
  collection: 'sessions'
});

store.on('error', function(error) {
  console.log('Session store error:', error);
});

app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Passport config will be initialized here later
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Make user available in all views
app.use(async (req, res, next) => {
  res.locals.user = req.user;
  
  if (req.user && req.user.role === 'Lecturer') {
    try {
      const LecturerProfile = require('./models/LecturerProfile');
      res.locals.lecturerProfile = await LecturerProfile.findOne({ userId: req.user._id, isDeleted: false }).lean();
    } catch (err) {
      console.error('Error fetching lecturer profile for locals:', err);
    }
  }
  
  next();
});

// Routes will be mounted here
app.use('/', require('./routes/index'));

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404);
  
  if (req.accepts('html')) {
    res.render('errors/404', { title: '404 - Page Not Found', path: req.path });
    return;
  }
  
  if (req.accepts('json')) {
    res.json({ success: false, message: 'Not found' });
    return;
  }
  
  res.type('txt').send('Not found');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (process.env.NODE_ENV !== 'test' || status >= 500) {
    console.error(err.stack);
  }
  
  res.status(status);
  
  if (req.accepts('html')) {
    const view = status === 403 ? 'errors/403' : 'errors/500';
    const title = status === 403 ? '403 - Forbidden' : '500 - Server Error';
    res.render(view, { title: title, message: err.message || 'Internal Server Error', path: req.path });
    return;
  }
  
  res.json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
