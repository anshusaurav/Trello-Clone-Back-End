var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var secret = require("../config").secret;

var UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/^[a-zA-Z0-9]+$/, "is invalid"],
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true,
    },
    fullname: {
      type: String,
      required: [true, "can't be blank"],
    },
    bio: String,
    image: String,

    hash: String,
    salt: String,
  },
  { timestamps: true }
);

UserSchema.plugin(uniqueValidator, { message: "is already taken." });

UserSchema.methods.validPassword = function (password) {
  var hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
};

UserSchema.methods.generateJWT = function () {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      exp: parseInt(exp.getTime() / 1000),
    },
    secret
  );
};

UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    fullname: this.fullname,
    token: this.generateJWT(),
    bio: this.bio,
    image: this.image
      ? `${this.image}`
      : "https://cdn4.iconfinder.com/data/icons/emoticons-4/100/smiley-11-512.png",

  };
};

UserSchema.methods.toProfileJSON = function () {
  return {
    username: this.username,
    fullname: this.fullname,
    bio: this.bio,
    image: this.image
      ? `${this.image}`
      : "https://cdn4.iconfinder.com/data/icons/emoticons-4/100/smiley-11-512.png",

  };
};

UserSchema.index({ username: "text", fullname: "text" });
module.exports = mongoose.model("User", UserSchema);

