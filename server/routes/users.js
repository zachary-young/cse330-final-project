var express = require('express');
const bcrypt = require('bcrypt');
var connection = require('../db.js');

var router = express.Router();

router.post('/login', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    if (!(username && password)) {
        res.json({
            success: false,
            message: "Please enter both a username and password"
        });
    } else {
        connection.query('SELECT * FROM users WHERE username = ?', [username], function (err, results, fields) {
            if (err) {
                next(err);
            } else {
                if (results.length == 0) {
                    res.json({
                        success: false,
                        message: "Invalid username or password"
                    });
                } else {
                    bcrypt.compare(password, results[0].password, function (err, equal) {
                        if (err) {
                            next(err);
                        } else {
                            if (!equal) {
                                res.json({
                                    success: false,
                                    message: "Invalid username or password"
                                });
                            } else {
                                req.session.authenticated = true;
                                req.session.username = username;
                                req.session.userID = results[0].id;
                                res.json({
                                    success: true,
                                    username: req.session.username
                                });
                            }
                        }
                    });
                }
            }
        });
    }
});

router.get('/auth', function (req, res, next) {
    if (req.session.authenticated == true) {
        res.json({
            success: true,
            username: req.session.username
        });
    } else {
        res.json({
            success: false,
            message: "Session expired"
        });
    }
});

router.get('/logout', function (req, res, next) {
    req.session.authenticated = false;
    req.session.username = ''
    req.session.userID = null;
    res.json({
        success: true
    });
});

router.post('/register', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    if (!(username && password)) {
        res.json({
            success: false,
            message: "Please enter both a username and password"
        });
    } else {
        connection.query('SELECT * FROM users WHERE username = ?', [username], function (err, results, fields) {
            if (err) {
                next(err);
            } else {
                if (results.length > 0) {
                    res.json({
                        success: false,
                        message: "Username is already taken"
                    });
                } else {
                    bcrypt.hash(password, 10, function (err, passwordHash) {
                        if (err) {
                            next(err);
                        } else {
                            connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, passwordHash], function (err, results, fields) {
                                if (err) {
                                    next(err);
                                } else {
                                    req.session.authenticated = true;
                                    req.session.username = username;
                                    req.session.userID = results.insertId;
                                    res.json({
                                        success: true,
                                        username: req.session.username
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
});

module.exports = router;
