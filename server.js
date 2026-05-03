require('./utils.js');
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const bcrypt = require('bcrypt');
const saltRounds = 12;

const app = express();

const Joi = require('joi');
const mongoSanitize = require('express-mongo-sanitize');

const PORT = process.env.PORT || 3000;
const expireTime = 1 * 60 * 60 * 1000; // 1 hour

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_user_database = process.env.MONGODB_USER_DATABASE;
const mongodb_session_database = process.env.MONGODB_SESSION_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

const {database} = include('databaseConnection');
const userCollection = database.db(mongodb_user_database).collection('users');

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.json());
// Express 5 makes req.query read-only; patch it so express-mongo-sanitize can strip operator keys
app.use((req, _res, next) => {
    Object.defineProperty(req, 'query', {
        ...Object.getOwnPropertyDescriptor(req, 'query'),
        value: req.query,
        writable: true,
    });
    next();
});
app.use(mongoSanitize({replaceWith: '%'}));
app.use(express.static('public'));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_session_database}?retryWrites=true&w=majority`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: expireTime,
        httpOnly: true,
        secure: false
    }
}));

/* ============================================================
   ROUTES
   ============================================================ */

app.get('/', (req, res) => {
    res.render('home', {
        authenticated: req.session.authenticated || false,
        name: req.session.name
    });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signupSubmit', async (req, res) => {
    const {name, email, password} = req.body;

    const schema = Joi.object({
        name: Joi.string().max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().max(50).required()
    });

    const validationResult = schema.validate({name, email, password});
    if (validationResult.error) {
        const errorMsg = validationResult.error.details[0].message;
        res.render('signupError', {error: errorMsg});
        return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await userCollection.insertOne({name, email, password: hashedPassword});

    req.session.authenticated = true;
    req.session.name = name;
    req.session.cookie.maxAge = expireTime;

    res.redirect('/members');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/loginSubmit', async (req, res) => {
    const {email, password} = req.body;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().max(50).required()
    });

    const validationResult = schema.validate({email, password});
    if (validationResult.error) {
        res.render('loginError', {error: validationResult.error.details[0].message});
        return;
    }

    const result = await userCollection.find({email: email}).project({name: 1, email: 1, password: 1, _id: 1}).toArray();

    if (result.length != 1) {
        res.render('loginError', {error: 'Invalid email or password.'});
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        req.session.authenticated = true;
        req.session.name = result[0].name;
        req.session.cookie.maxAge = expireTime;
        res.redirect('/members');
        return;
    }

    res.render('loginError', {error: 'Invalid email or password.'});
});

app.get('/members', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/');
        return;
    }

    const images = ['images.jpg', 'sad-orangutang-zoo-26546600.webp', 'the-bornean-orangutan-pongo-pygmaeus-is-a-species-of-orangutan-native-to-the-island-of-borneo-together-with-the-sumatran-orangutan-pongo-abelii-2GAJ4K7.jpg'];
    const randomImage = images[Math.floor(Math.random() * images.length)];

    res.render('members', {name: req.session.name, image: randomImage});
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
