var express = require('express');
var connection = require('../db.js');

var router = express.Router();

router.get('/all', function (req, res, next) {
    connection.query('SELECT * FROM restaurants', function (err, results, fields) {
        if (err) {
            next(err);
        } else {
            var restaurantList = {
                restaurants: Array()
            };
            for (var i = 0; i < results.length; i++) {
                restaurantList.restaurants.push({
                    id: results[i].id,
                    key: i,
                    name: results[i].name,
                    desc: results[i].description
                });
            } 
            res.json(restaurantList);
        }
    });
});

router.post('/search', function (req, res, next) {
    var searchPhrase = req.body.searchPhrase;
    connection.query("SELECT * FROM restaurants WHERE SOUNDEX(name) LIKE CONCAT(TRIM(TRAILING '0' FROM SOUNDEX(?)), '%') OR name LIKE CONCAT('%', ? '%')", [searchPhrase, searchPhrase], function (err, results, fields) {
        if (err) {
            next(err);
        } else {
            var restaurantList = {
                restaurants: Array()
            };
            for (var i = 0; i < results.length; i++) {
                restaurantList.restaurants.push({
                    id: results[i].id,
                    key: i,
                    name: results[i].name,
                    desc: results[i].description
                });
            } 
            res.json(restaurantList);
        }
    });
});

router.post('/prox', function (req, res, next){
    var xCoord = req.body.xCoord;
    var yCoord = req.body.yCoord;
    connection.query("SELECT * FROM restaurants WHERE ST_Distance(Point(?,?), Point(xcoord,ycoord)) < 0.018;", [xCoord, yCoord], function (err, results, fields){
        if(err){
            next(err);
        } else{
            var proxyList = {
                proxy: Array()
            };
            for (var i = 0; i < results.length; i++){
                proxyList.proxy.push({
                    id: results[i].id,
                    key: i,
                    name: results[i].name,
                    desc: results[i].description,
                    xCoord: results[i].xcoord,
                    yCoord: results[i].ycoord
                });
            }
            res.json(proxyList);
        }
    });
});

module.exports = router;
