var _ = require('underscore');
var request = require('request');
var fs = require('fs');
var sqlite = require('sqlite3').verbose();

var db = new sqlite.Database('movies.db');

db.run("CREATE TABLE IF NOT EXISTS movies (id INTEGER PRIMARY KEY, title TEXT, year NUMERIC, rated TEXT, released TEXT, runtime TEXT, genre TEXT, director TEXT, writer TEXT, actors TEXT, plot TEXT, language TEXT, country TEXT, awards TEXT, poster TEXT, metascore INTEGER, imdbRating INTEGER, imdbVotes INTEGER, imdbID TEXT, type TEXT, votes INTEGER)");

db.run("CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY, name TEXT)");

db.run("CREATE TABLE IF NOT EXISTS movies_people (id INTEGER PRIMARY KEY, movie_id INTEGER, person_id INTEGER, role TEXT)");



var getOrAddPerson = function(name, callback) {
    var selectStmt = 'SELECT * FROM people WHERE name = "' + name + '"';
    db.get(selectStmt, function(err, personRow) {
        if(personRow) {
            callback(personRow);
        } else {
            db.run('INSERT INTO people VALUES (null, "' + name + '")', function() {
                db.get(selectStmt, function(err, personRow) {
                    callback(personRow);
                });        
            });
        }
    });
}

var addDirectors = function(directors, movie) {
    directors = directors.split(", ");
    this.movie = movie;
    _.each(directors, function(name) {
        var movieId = this.movie.id;
        getOrAddPerson(name, function(person) {
            db.run('INSERT INTO movies_people VALUES (null, ' + movieId + ', ' + person.id + ', "director")'); 
        });
    }, this);
}

var addActors = function(actors, movie) {
    actors = actors.split(", ");
    this.movie = movie;
    _.each(actors, function(name) {
        var movieId = this.movie.id;
        getOrAddPerson(name, function(person) {
            db.run('INSERT INTO movies_people VALUES (null, ' + movieId + ', ' + person.id + ', "actor")'); 
        });
    }, this);
}

var storeResults = function(results) {
    var data = _.map(_.toArray(results), function(item) {
            return '"' + item + '"';
        }).join(",");
    db.run('INSERT INTO movies VALUES (null, ' + data + ', 0)', function() {
        db.get('SELECT * FROM movies WHERE title = "' + results.Title + '"', function(err, movieRow) {
            addDirectors(results.Director, movieRow);
            _.delay(addActors, 1000, results.Actors, movieRow); // In case someone directed and acted (could check this first but meh)
        });
    }); 
}

var getMovieData = function(index) {
    if (index >= titles.length) {
        return;
    }
    var title = titles[index];
    var url = 'http://www.omdbapi.com/?t=' + title.replace(" ", "+") + '&y=&plot=short&r=json';
    request(url, function(err, response, body) {
        var results = JSON.parse(body);
        // if (results.Title != title) {
        //     console.log(title + " does not match results: " + results.Title);
        // }
        if (results.Response === "Error") {
            console.log(results);
        } else {
            storeResults(_.omit(results, "Response"));
        }
    });

    _.delay(getMovieData, 1000, index+1); // To prevent dupes in people table. Hacky and slow but working
}

var data = fs.readFileSync('movies.txt', 'utf8');
var titles = data.split('\r\n');
db.serialize();
getMovieData(0);

// Housekeeping:
    // Double check years (Mad Max was wrong, looks right now)
    // Figure out what's wrong with Battle Royale or add manually