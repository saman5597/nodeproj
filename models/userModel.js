const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name.'], // Data Validator
      trim: true,
      match: [/^[a-zA-Z\s]+$/, 'User name must contain only alphabets.'],
      maxlength: [
        40,
        'A user name must have less or equal than 40 characters.'
      ], // Data Validator - for Numbers and Dates
      minlength: [10, 'A user name must have more or equal than 10 characters.'] // Data Validator
    },
    email: {
      type: String,
      required: [true, 'Please enter your email.'], // Data Validator
      unique: true, // Not a Data Validator
      trim: true,
      lowercase: true, // Not a Data Validator
      validate: [validator.isEmail, 'Please provide a valid email.']
    },
    photo: String,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      maxlength: [12, 'Password must have less or equal than 12 characters.'], // Data Validator - for Numbers and Dates
      minlength: [6, 'Password must have more or equal than 6 characters.'], // Data Validator
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password.'],
      maxlength: [12, 'Password must have less or equal than 12 characters.'], // Data Validator - for Numbers and Dates
      minlength: [8, 'Password must have more or equal than 8 characters.'], // Data Validator
      validate: {
        //Custom Validator
        validator: function(val) {
          //this func will not work in update (only valid for new document - create)
          return val === this.password;
        },
        message: 'Passwords did not matched.'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

userSchema.pre('save', async function(next) {
  // Only run if password was actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } }); //Showing only active accounts
  next();
});

// Instance Methods - called on Documents
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // FALSE means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
