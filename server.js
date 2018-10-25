//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    bodyParser = require('body-parser')
    User = require('./model/User'),
    FDHandler = require('./handler/AuthHandler'),
    JWTUTils = require ("./lib/JWTUtils.js");

    var apiRoutes = express.Router();


Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
mongoURL = "mongodb://fdmdbuser:fdmdbpwd@ds241065.mlab.com:41065/fddb";
if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}


var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  console.log("inside initDB");
  if (mongoURL == null) return;
  console.log("mongoURL: "+ mongoURL);
  var mongodb = require('mongoose');
  if (mongodb == null) return;
  mongodb.Promise  = require('bluebird');
  //mongodb.connect(mongoURL, function(err, conn) {
    //if (err) {
    //  callback(err);
    //  return;
    //}

    //db = conn;
    db =  mongodb.connect(mongoURL,{
			  useMongoClient: true,
			  /* other options */
			});
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  //});

  //mongodb.connect(mongoURL);

};


apiRoutes.use(function(req, res, next) {
  // console.log ('inside apiRoutes');
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  var token = req.headers['x-access-token'];

  // decode token
  if (token) {
    var jwt = new JWTUTils();
    var P =   jwt.decoded(token);
    P.then(function (re){
      //console.log ("decoded &&&& " + JSON.stringify(re));
      next();
    }).catch(function(e) {
      console.log (e);l
      return  res.json({ success: false, message: 'Failed to authenticate token.' });
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }
});

app.use('/auth', apiRoutes);

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

 app.post('/register', function (req, res){
    console.log("inside regiser post" + db);
    res.setHeader('Content-Type', 'application/json');
    if (!db) {
      console.log("!db");
      initDb(function(err){});
    }
    var handler = new FDHandler();
    handler.handleRequest('REGISTER', db, req, res);
});

app.post('/logon', function (req, res){
   console.log("inside login post" + db);
   res.setHeader('Content-Type', 'application/json');
   if (!db) {
     initDb(function(err){});
   }
   var handler = new FDHandler();
   handler.handleRequest('LOGIN', db, req, res);
});

app.post('/auth/feedback', function (req, res){
   console.log("inside feedback post" + db);
   res.setHeader('Content-Type', 'application/json');
   if (!db) {
     console.log("!db");
     initDb(function(err){});
   }
   var handler = new FDHandler();
   handler.handleRequest('SEND_FEEDBACK', db, req, res);
});

app.post('/auth/seeFeedback', function (req, res){  
   res.setHeader('Content-Type', 'application/json');
   if (!db) {
     console.log("!db");
     initDb(function(err){});
   }
   var handler = new FDHandler();
   handler.handleRequest('SEE_FEEDBACK', db, req, res);
});



// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
