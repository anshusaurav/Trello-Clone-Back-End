var mongoose = require("mongoose");
var slug = require("slug")
var ListSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        name: {
            type: String,
            required: [true, "can't be blank"],
            index: true,
        },
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        issues: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Issue'
            }
        ]


    },
    { timestamps: true }
)
ListSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

ListSchema.methods.slugify = function () {
    this.slug =
        slug(this.name) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};
ListSchema.methods.toListJSON = function () {
    // let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this._id,
        slug: this.slug,
        name: this.name,
        board: this.board,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("List", ListSchema);
