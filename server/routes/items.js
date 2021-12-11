var express = require('express');
var connection = require('../db.js');

var router = express.Router();

router.post('/all', function (req, res, next) {
    var restaurantID = req.body.restaurantID;
    connection.query("SELECT items.id, items.name, AVG(reviews.rating) as average_rating FROM items LEFT JOIN reviews ON reviews.item_id = items.id WHERE restaurant_id = ? GROUP BY items.id ORDER BY average_rating DESC", [restaurantID], function (err, results, fields) {
        if (err) {
            next(err);
        } else {
            var itemList = {
                items: Array()
            };
            for (var i = 0; i < results.length; i++) {
                itemList.items.push({
                    id: results[i].id,
                    key: i,
                    name: results[i].name,
                    rating: results[i].average_rating || null
                });
            } 
            res.json(itemList);
        }
    });
});

module.exports = router;