// use the express middleware
var express = require('express');

// make express handle JSON and other requests
var bodyParser = require('body-parser');

// use cross origin resource sharing
var cors = require('cors');

// instantiate app
var app = express()
  , pg = require('pg').native
  , connectionString = process.env.DATABASE_URL 
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

 var quotes = [
  { author : 'Audrey Hepburn', text : "Nothing is impossible, the word itself says 'I'm possible'!"},
  { author : 'Walt Disney', text : "You may not realize it when it happens, but a kick in the teeth may be the best thing in the world for you"},
  { author : 'Unknown', text : "Even the greatest was once a beginner. Don’t be afraid to take that first step."},
  { author : 'Neale Donald Walsch', text : "You are afraid to die, and you’re afraid to live. What a way to exist."}
];

// make sure we can parse JSON
app.use(bodyParser.json());
app.use(bodyParser());
// serve up files from this directory 
app.use(express.static(__dirname));


// make sure we use CORS to avoid cross domain problems
app.use(cors());



app.get('/quote/random', function(req, res) {
//  var id = Math.floor(Math.random() * quotes.length);
//  var q = quotes[id];
//  res.send(q);
   query = client.query('SELECT COUNT(id) AS COUNT FROM quote');
   query.on('row', function(  result) {
      if(result){
      	var ids = Math.floor(Math.random() * result.count);
        query = client.query('SELECT id, quote, text FROM quote WHERE id = $1', [ids]);
	query.on('row', function (result){
	   res.send(result);
	});
      }
   });

});


app.get('/quote/:id', function(req, res) {
  
  if(req.params.id < 0 ){
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }

 // var q = quotes[req.params.id];
  //res.send(q);
  query = client.query('SELECT author, text FROM quote WHERE id = $1', [req.params.id]);
  query.on('row', function(result) {
    console.log(result);

    if (!result) {
      return res.send('No data found');
    } else {
      res.send(result);
    }
  }); 


});

app.post('/quotea', function(req, res) {
  console.log(req.body);
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
 // if(!req.body.hasOwnProperty('author') ){ console.log('fk author');} 
//  if(!req.body.hasOwnProperty('text')){console.log('fk text ');} 
    console.log("body suck");	
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };
   newQuote.pos = quotes.length;
 //console.log("FK");
 query = client.query('SELECT COUNT(id) AS COUNT FROM quote');
    query.on('row', function(  result) { 

    	if(result){
	console.log("-->" + result.count); 
	query = client.query('INSERT INTO quote (id , author , text) VALUES($1, $2, $3)', [result.count , newQuote.author+ result.count , newQuote.text], function (err){
	if (err) return res.send('Error : Can not add to database');
	else {
	console.log("add Property to newQuote");
	newQuote.pos = result.count;
	newQuote.author = newQuote.author+result.count ; 	
	newQuote.text = newQuote.text ;
	res.send(newQuote);	
	}
});
	}else { console.log("ERROR in getCount");
	        return res.send('Error : Can not add to database'); 
	}
    });

});

app.delete('/quote/:id', function(req, res) {
/*  if(quotes.length <= req.params.id) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }

  quotes.splice(req.params.id, 1);
  res.json(true);*/
   query = client.query('DELETE FROM quote WHERE id = $1', [req.params.id], function (err){
	if(err){
	  res.statusCode = 404;
	  return res.send('Error 404: No quote found');
	}else {
	  res.statusCode = 204;
	  res.json(true);
	
	}

   });  




});

// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

