var router = require("express").Router()
var mongoose = require("mongoose")
var User = mongoose.model("User")
var Issue = mongoose.model("Issue")
var Comment = mongoose.model("Comment")
var auth = require("../auth");


/**
 * Get all comments in param issue id
 */
router.get("/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Issue.findById(id).then(function (issue) {
            issue.populate({
                path: 'comments',
                select: '-__v'

            }).populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: '-salt -__v -hash'
                },
                select: '-__v'
            })
                .execPopulate()
                .then(function (issue) {
                    return res.json({
                        comments: issue.comments.map(function (comment) {
                            return comment;
                        }),
                    });
                })
        });
    }).catch(next);
});

/**
 * add new comment to issue id
 */
router.post("/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        const { body } = req.body.comment;
        var comment = new Comment({
            body
        })
        comment.author = user;
        comment.issue = id
        return Issue.findById(id).then(function (issue) {
            if (!issue) {
                return res.status(401).send('No such Issue found');
            }
            return comment.save().then(function (comment) {
                issue.addComment(comment.id);
                return res.json({ comment });
            })
        })

    })
});

/**
 * Get Single Comment by ID
 */
router.get("/single/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Comment.findById(id).then(function (comment) {
            if (!comment) {
                return res.status(401).send('No such Comment found');
            }
            console.log(comment);
            return res.json({ comment });
        })
    })
})

/**
 * Delete single Comment by Id
 */
router.delete("/single/:id", auth.required, function (req, res, next) {
    const { id } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Issue.findOne({ comments: id }).then(function (issue) {
            console.log('issue: ', issue._doc.title)
            if (!issue) {
                return res.status(401).send('This comments is not found in any issues');
            }
            issue.deleteComment(id);
            return Comment.findById(id).then(function (comment) {
                if (!comment) {
                    return res.status(401).send('No such Comment found');
                }
                comment.remove().then(function (comment) {
                    return res.json({ comment });
                })

            })

        })
    })
})


module.exports = router