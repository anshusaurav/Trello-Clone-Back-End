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
        slug(this.name) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};
IssueSchema.methods.toListJSON = function () {
    // let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this._id,
        slug: this.slug,
        title: this.title,
        desctiption: this.description,
        labels: this.labels,
        dueDate: this.dueDate,
        members: this.members,
        isComplete: this.isComplete,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("Issue", IssueSchema);
