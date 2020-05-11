const mongoose = require('mongoose');
const slugify = require('slugify');

// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'], // Data Validator
      unique: true, // Not a Data Validator
      trim: true,
      match: [/^[a-zA-Z\s]+$/, 'Tour name must contain only alphabets.'],
      // validate: [validator.isAlpha, 'Tour name must contain only alphabets'], // Validator module's validation
      maxlength: [
        40,
        'A tour name must have less or equal than 40 characters.'
      ], // Data Validator - for Numbers and Dates
      minlength: [10, 'A tour name must have more or equal than 10 characters.'] // Data Validator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        //only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult.'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0.'],
      max: [5, 'Rating must be below 5.0.'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.']
    },
    priceDiscount: {
      type: Number,
      validate: {
        //Custom Validator
        validator: function(val) {
          //this func will not work in update (only valid for new document - create)
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price.'
      }
    },
    summary: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.']
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // guides: Array
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User' //Child referencing
      }
    ]
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

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationInWeeks').get(function() {
  //virtual properties
  //not part of database (so we can't manipulate these fields in querying)
  return this.duration / 7;
});

// Virtual Populate (Parent Referencing)
tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour'
});

// DOCUMENT Middleware - runs before:- save() and create() but not on insertMany()
// Hook(Middleware)

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embedding
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// QUERY Middleware - runs before or after a certain query is executed
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); //Secret Tour
  next();
});

tourSchema.pre(/^find/, function(next) {
  // Populate - Join
  this.populate({
    path: 'guides',
    select: '-__v -passwordResetToken -passwordResetExpires -passwordChangedAt'
  });
  next();
});

// AGGREGATION Middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //unshift adds element in array in 1st position
//   // console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
