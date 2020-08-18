var router = require('express').Router();
router.use('/', require('./users'));
router.use('/teams', require('./teams'));
router.use('/boards', require('./boards'));
router.use('/lists', require('./lists'));
router.use('/issues', require('./issues'));
router.use(function (err, req, res, next) {
    if (err.name === 'ValidationError') {
        return res.status(422).json({
            errors: Object.keys(err.errors).reduce(function (errors, key) {
                errors[key] = err.errors[key].message;

                return errors;
            }, {})
        });
    }

    return next(err);
});

module.exports = router;