//express requirements
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

//run express
var app = express();

//mongo scheemas(mongoose)

//show scheema
var showSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  airsDayOfWeek: String,
  airsTime: String,
  firstAired: Date,
  genre: [String],
  network: String,
  overview: String,
  rating: Number,
  ratingCount: Number,
  status: String,
  poster: String,
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  }],
  episodes: [{
      season: Number,
      episodeNumber: Number,
      episodeName: String,
      firstAired: Date,
      overview: String
  }]
});

//user scheema
var userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

//models
var User = mongoose.model('User', userSchema);
var Show = mongoose.model('Show', showSchema);


//connect to database
mongoose.connect("mongodb://localhost:27017/show", function(err,db){
    if(!err){
        console.log("we are connected to mongo");
    }
})

//midleware
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//routes

//route for all shows
app.get('/api/shows', function(req, res, next) {
  var query = Show.find();
  if (req.query.genre) {
    query.where({ genre: req.query.genre });
  } else if (req.query.alphabet) {
    query.where({ name: new RegExp('^' + '[' + req.query.alphabet + ']', 'i') });
  } else {
    query.limit(12);
  }
  query.exec(function(err, shows) {
    if (err) return next(err);
    res.status(200).send(shows);
  });
});

//route for specific show
app.get('/api/shows/:id', function(req, res, next) {
  Show.findById(req.params.id, function(err, show) {
    if (err) return next(err);
    res.status(200).send(show);
  });
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(404).send({message: err.message});
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
