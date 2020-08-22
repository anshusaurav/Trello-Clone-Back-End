var mongoose = require("mongoose");
var slug = require("slug")
var IssueSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        title: {
            type: String,
            required: [true, "can't be blank"],
            index: true,
        },
        description: {
            type: String
        },
        labels: [{
            type: String
        }],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }],
        dueDate: {
            type: Date,
            default: Date.now
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        isComplete: {
            type: Boolean,
            default: false
        }


    },
    { timestamps: true }
)
IssueSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

IssueSchema.methods.slugify = function () {
    this.slug =
        slug(this.title) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};
IssueSchema.methods.addComment = function (id) {
    if (this.comments.indexOf(id) === -1) {
        this.comments = this.comments.concat([id]);
    }
    return this.save();
};

IssueSchema.methods.deleteComment = function (id) {
    this.comments.remove(id);
    return this.save();
}
/**
 * Checks whether card with id is present in list or not
 * @param {*} id 
 */
IssueSchema.methods.isCommentPresent = function (id) {
    return this.comments.some(function (commentId) {
        return commentId.toString() === id.toString();
    })
};
IssueSchema.methods.toIssueJSON = function () {
    // let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this._id,
        slug: this.slug,
        title: this.title,
        desctiption: this.description,
        labels: this.labels,
        comments: this.comments,
        dueDate: this.dueDate,
        members: this.members,
        isComplete: this.isComplete,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("Issue", IssueSchema);
