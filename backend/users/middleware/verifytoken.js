const jwt = require('jsonwebtoken');
const config = require('../config/main');

module.exports = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['authorization'];
    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) return res.status(403).send({ "error": "Sorry, this token is not valid.", "success": false });
            req.decoded = decoded;
            next();
        });
    } else return res.status(403).send({ "error": "Sorry, this token is not valid.", "success": false });
};