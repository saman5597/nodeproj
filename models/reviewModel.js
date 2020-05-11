const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be blank.'], // Data Validator
      trim: true,
      maxlength: [
        255,
        'A tour name must have less or equal than 255 characters.'
      ] // Data Validator - for Numbers and Dates
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0.'],
      max: [5, 'Rating must be below 5.0.']
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', //Parent referencing
      required: [true, 'Review must belong to a user.']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour', //Parent referencing
      required: [true, 'Review must belong to a tour.']
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

reviewSchema.index({ rating: -1 }); // For faster results
// To prevent duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // Populate - Join
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// Static Methods - called on Schemas
reviewSchema.statics.calcAvgRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  this.constructor.calcAvgRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

// Calling calcAvgRatings in case of Update/Delete
reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here
  await this.r.constructor.calcAvgRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
