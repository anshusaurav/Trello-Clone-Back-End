var router = require("express").Router()
var mongoose = require("mongoose")
var User = mongoose.model("User")
var Team = mongoose.model("Team")
var Board = mongoose.model("Board")
var List = mongoose.model("List")
var Issue = mongoose.model("Issue")
var auth = require("../auth");
const { isNullOrUndefined } = require("util")
// router.param("issues", function (req, res, next, id) {
//     Issue.findById(id)
//         .then(function (issue) {
//             if (!issue) {
//                 return res.sendStatus(404);
//             }

//             req.issue = issue;
//             console.log("issue assigned");
//             return next();
//         })
//         .catch(next);
// });

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
 * Get Single Issue by ID
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

/**
 * Delete single issue by Id
 */
router.delete("/single/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findOne({ issues: id }).then(function (list) {
            if (!list) {
                return res.status(401).send('No such List found');
            }
            list.deleteCard(id);
            return Issue.findById(id).then(function (issue) {
                if (!issue) {
                    return res.status(401).send('No such Issue found');
                }
                issue.remove().then(function (issue) {
                    return res.json({ issue });
                })

            })

        })
    })
})

//Update single Issue by id
router.put("/single/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Issue.findById(id).then(function (issue) {
                // console.log(issue)
                if (!issue)
                    return res.status(401).send('No such Issue found');
                if (typeof req.body.issue.dueDate !== 'undefined') {
                    issue.dueDate = req.body.issue.dueDate
                }
                if (typeof req.body.issue.labels !== 'undefined') {
                    issue.labels = req.body.issue.labels
                }
                if (typeof req.body.issue.title !== 'undefined') {
                    issue.title = req.body.issue.title
                }
                if (typeof req.body.issue.description !== 'undefined') {
                    issue.description = req.body.issue.description
                }
                issue.save().then(function (issue) {
                    return res.json({ issue });

                });
            });
        })

        .catch(next);
})

router.post("/labels/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Issue.findById(id).then(function (issue) {
                // console.log(issue)
                if (!issue)
                    return res.status(401).send('No such Issue found');
                if (typeof req.body.issue.label !== 'undefined') {
                    issue.addLabel(req.body.issue.label);
                }
                issue.save().then(function (issue) {
                    return res.json({ issue });

                });
            });
        })

        .catch(next);
})


router.delete("/labels/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Issue.findById(id).then(function (issue) {
                // console.log(issue)
                if (!issue)
                    return res.status(401).send('No such Issue found');
                if (typeof req.body.issue.label !== 'undefined') {
                    issue.deleteLabel(req.body.issue.label);
                }
                issue.save().then(function (issue) {
                    return res.json({ issue });

                });
            });
        })

        .catch(next);
})


module.exports = router