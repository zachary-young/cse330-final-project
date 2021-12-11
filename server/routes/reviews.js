var express = require('express');
var connection = require('../db.js');
var path = require('path');
var multer = require('multer');

const upload = multer({
    fileFilter: function (req, file, cb) {
        var filetype = path.extname(file.originalname);
        if (filetype !== '.png' && filetype !== '.jpg' && filetype && filetype !== '.jpeg') {
            cb(new Error('Please only upload photos'), false)
        } else {
            cb(null, true)
        }
    }
}).single('photo');

var router = express.Router();

router.post('/all', function (req, res, next) {
    var itemID = req.body.itemID;
    connection.query("SELECT *, reviews.id AS review_id, (SELECT COUNT(*) FROM gulp.likes WHERE review_id = reviews.id) AS like_count FROM gulp.reviews LEFT JOIN gulp.users ON reviews.user_id = users.id WHERE item_id = ? ORDER BY timestamp DESC", [itemID], function (err, results, fields) {
        if (err) {
            next(err);
        } else {
            var reviewList = {
                reviews: Array()
            };
            for (var i = 0; i < results.length; i++) {
                reviewList.reviews.push({
                    id: results[i].review_id,
                    username: results[i].username,
                    key: i,
                    likes: results[i].like_count,
                    rating: results[i].rating,
                    description: results[i].description,
                    image: results[i].photo
                });
            }
            res.json(reviewList);
        }
    });
});

router.post('/add', function (req, res, next) {
    upload(req, res, function (error) {
        if (!req.session.authenticated) {
            res.json({
                success: false,
                message: "Please login before writing a review"
            });
        } else {
            if (error) {
                res.send({
                    success: false,
                    message: "Please upload a photo"
                });
            } else {
                var itemID = req.body.itemID;
                var rating = req.body.rating;
                var description = req.body.description;
                var base64 = req.file ? req.file.buffer.toString('base64') : null;
                if (rating) {
                    connection.query("INSERT INTO reviews (user_id, item_id, rating, description, photo) VALUES (?, ?, ?, ?, ?)", [req.session.userID, itemID, rating, description, base64], function (err, results, fields) {
                        if (err) {
                            next(err);
                        } else {
                            res.json({
                                success: true,
                            });
                        }
                    });
                }
            }
        }
    })
});

router.post('/delete', function (req, res, next) {
    var reviewID = req.body.reviewID;
    connection.query("SELECT * FROM reviews WHERE id = ?", [reviewID], function (err, results, fields) {
        if (err) {
            next(err);
        } else {
            if (results.length == 1) {
                if (results[0].user_id == req.session.userID) {
                    connection.query("DELETE FROM reviews WHERE id = ?", [reviewID], function (err, results, fields) {
                        if (err) {
                            next(err);
                        } else {
                            res.json({
                                success: true
                            });
                        }
                    });
                } else {
                    res.json({
                        success: false,
                        message: "Please login as user to delete review"
                    });
                }
            } else {
                res.json({
                    success: false,
                    message: "Could not find review"
                });
            }
        }
    });
});

router.post('/like', function (req, res, next) {
    if (!req.session.authenticated) {
        res.json({
            success: false,
            message: "Please login before liking a review"
        });
    } else {
        var reviewID = req.body.reviewID;
        connection.query("SELECT * FROM likes WHERE review_id = ?", [reviewID], function (err, results, fields) {
            if (err) {
                next(err);
            } else {
                var alreadyLiked = false;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].user_id == req.session.userID) {
                        alreadyLiked = true;
                        break;
                    }
                }
                if (alreadyLiked) {
                    res.json({
                        success: false,
                        message: "You already liked this review"
                    });
                } else {
                    connection.query("INSERT INTO likes (user_id, review_id) VALUES (?, ?)", [req.session.userID, reviewID], function (err, results, fields) {
                        res.json({
                            success: true,
                        });
                    });
                }
            }
        });
    }
});

module.exports = router;