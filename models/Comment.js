var mongoose = require("mongoose");
var slug = require("slug")
var CommentSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        body: {
            type: String,
            required: [true, "can't be blank"],
            index: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        issue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Issue"
        }
    },
    { timestamps: true }
)
CommentSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

CommentSchema.methods.slugify = function () {
    this.slug =
        slug(this.body) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};
CommentSchema.methods.toIssueJSON = function () {
    // let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this._id,
        slug: this.slug,
        body: this.body,
        author: this.author,
        issue: this.issue,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("Comment", CommentSchema);
