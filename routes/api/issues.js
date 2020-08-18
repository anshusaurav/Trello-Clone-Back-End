var router = require("express").Router()
var mongoose = require("mongoose")
var User = mongoose.model("User")
var Team = mongoose.model("Team")
var Board = mongoose.model("Board")
var List = mongoose.model("List")
var Issue = mongoose.model("Issue")
var auth = require("../auth");
router.param("issues", function (req, res, next, id) {
    Issue.findById(id)
        .then(function (issue) {
            if (!issue) {
                return res.sendStatus(404);
            }

            req.issue = issue;
            console.log("issue assigned");
            return next();
        })
        .catch(next);
});

/**
 * Get all issues in param list id
 */
router.get("/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findById(id).then(function (list) {
            list.populate({
                path: 'issues',
                select: '-__v'
            })
                .execPopulate()
                .then(function (list) {
                    return res.json({
                        issues: list.issues.map(function (issue) {
                            return issue._doc;
                        }),
                    });
                })
        });
    }).catch(next);
});

/**
 * add new issue to list id
 */
router.post("/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        // util.inspect(req.body.board);
        const { title } = req.body.issue;
        var issue = new Issue({
            title
        })
        return List.findById(id).then(function (list) {
            if (!list) {
                return res.status(401).send('No such list found');
            }
            return issue.save().then(function (issue) {
                list.appendCard(issue.id);
                return res.json({ issue: issue._doc });
            })
        })

    })
});

/**
 * Get Single 
 */
router.get("/single/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Issue.findById(id).then(function (issue) {
            if (!issue) {
                return res.status(401).send('No such Issue found');
            }
            console.log(issue);
            return res.json({ issue });
        })
    })
})


module.exports = router