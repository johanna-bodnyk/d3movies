var express = require('express');
var _ = require('underscore');
var request = require('request');
var fs = require('fs');
var sqlite = require('sqlite3').verbose();

var app = express();
app.set('view engine', 'hbs');
app.use(express.static('public'));

var db = new sqlite.Database('movies.db');

// Routes
app.get('/', function(req, res) {
    db.all("SELECT * FROM movies", function(err, rows) {
        res.render('index', {data: JSON.stringify(rows)});
    });
});

// Start server
app.listen(3000, function() {
    console.log("I'm listening");
});

