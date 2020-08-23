var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
var cors = require('cors');
var errorhandler = require('errorhandler');
var mongoose = require('mongoose');

var isProduction = process.env.NODE_ENV === 'development'


var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'trello',
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: false
    })
)

if (!isProduction) {
    app.use(errorhandler())
}

mongoose.connect("mongodb+srv://anshu:anshu@cluster0.qcfnf.mongodb.net/trelloDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err, db) {
    if (err) {
        console.log(err);
    }
    else {
        console.log('connected to ' + "mongodb://localhost:27017/trelloDB");
        mongoose.set('debug', true)
        // db.close();
    }
})

mongoose.set('debug', true)


require('./models/User');
require('./models/Team');
require('./models/Board');
require('./models/List');
require('./models/Issue');
require('./models/Comment');
require('./config/passport')

app.use(require('./routes'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
    app.use(function (err, req, res, next) {
        console.log(err.stack)

        res.status(err.status || 500)

        res.json({
            errors: {
                message: err.message,
                error: err
            }
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.json({
        errors: {
            message: err.message,
            error: {}
        }
    })
})

// finally, let's start our server...
var server = app.listen(process.env.PORT || 4000, function () {
    console.log('Listening on port ' + server.address().port)
})
