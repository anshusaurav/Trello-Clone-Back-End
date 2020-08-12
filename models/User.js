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

UserSchema.methods.toProfileJSONFor = function (user) {
  // console.log()
  return {
    username: this.username,
    fullname: this.fullname,
    bio: this.bio,
    image: this.image
      ? `${this.image}`
      : "https://cdn4.iconfinder.com/data/icons/emoticons-4/100/smiley-11-512.png",

  };
};
// UserSchema.methods.addImagePost = function (id) {
//   if (this.imageposts.indexOf(id) === -1) {
//     this.imageposts = this.imageposts.concat([id]);
//   }

//   return this.save();
// };

// UserSchema.methods.removeImagePost = function (id) {
//   this.imageposts.remove(id);
//   return this.save();
// };

// UserSchema.methods.saveImage = function (id) {
//   if (this.savedImages.indexOf(id) === -1) {
//     this.savedImages = this.savedImages.concat([id]);
//   }
//   return this.save();
// };
// UserSchema.methods.unSaveImage = function (id) {
//   this.savedImages.remove(id);
//   return this.save();
// };
// UserSchema.methods.isSaved = function (id) {
//   return this.savedImages.some(function (favoriteId) {
//     return favoriteId.toString() === id.toString();
//   });
// };
// UserSchema.methods.favorite = function (id) {
//   if (this.favorites.indexOf(id) === -1) {
//     this.favorites = this.favorites.concat([id]);
//   }

//   return this.save();
// };

// UserSchema.methods.unfavorite = function (id) {
//   this.favorites.remove(id);
//   return this.save();
// };

// UserSchema.methods.isFavorite = function (id) {
//   return this.favorites.some(function (favoriteId) {
//     return favoriteId.toString() === id.toString();
//   });
// };

// UserSchema.methods.follow = function (id) {
//   if (this.following.indexOf(id) === -1) {
//     this.following = this.following.concat(id);
//   }

//   return this.save();
// };

// UserSchema.methods.unfollow = function (id) {
//   this.following.remove(id);
//   return this.save();
// };

// UserSchema.methods.getFollowed = function (id) {
//   if (this.follower.indexOf(id) === -1) {
//     this.follower = this.follower.concat(id);
//   }
//   return this.save();
// };
// UserSchema.methods.getUnfollowed = function (id) {
//   this.follower.remove(id);
//   return this.save();
// };
// UserSchema.methods.isFollowing = function (id) {
//   return this.following.some(function (followId) {
//     return followId.toString() === id.toString();
//   });
// };
// UserSchema.methods.communicate = function (id) {
//   if (this.communicatedProfiles.indexOf(id) === -1) {
//     this.communicatedProfiles = this.communicatedProfiles.concat(id);
//   }
//   return this.save();
// };
// UserSchema.methods.unCommunicate = function (id) {
//   this.communicatedProfiles.remove(id);
//   return this.save();
// };
// UserSchema.methods.isCommunicating = function (id) {
//   return this.communicatedProfiles.some(function (commId) {
//     return commId.toString() === id.toString();
//   });
// };
UserSchema.index({ username: "text", fullname: "text" });
mongoose.model("User", UserSchema);
