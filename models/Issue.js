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
            // default: Date.now
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
 * Checks whether comment with id is present in issue or not
 * @param {*} id 
 */
IssueSchema.methods.isCommentPresent = function (id) {
    return this.comments.some(function (commentId) {
        return commentId.toString() === id.toString();
    })
};

IssueSchema.methods.addLabel = function (label) {
    if (this.labels.indexOf(label.toLowerCase()) === -1) {
        this.labels = this.labels.concat([label.toLowerCase()]);
    }
};

IssueSchema.methods.deleteLabel = function (label) {
    this.labels.remove(label.toLowerCase());

}
/**
 * Checks whether label in card
 * @param {*} label 
 */
IssueSchema.methods.isLabelPresent = function (label) {
    return this.labels.some(function (labelI) {
        return labelI === label;
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
