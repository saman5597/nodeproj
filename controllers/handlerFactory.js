const catchAsync = require('./../util/catchAsync');
const APIFeatures = require('./../util/apiFeatures');
const AppErrorHandler = require('./../util/errorHandler');

// CRUD Operations Down Here ---------------------------------------------

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Execute Query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();

    // Send Response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    // doc.findOne({ _id : req.params.id})

    if (!doc) {
      return next(new AppErrorHandler('No data found with that ID.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour();
    // newTour.save(); //Method - 1

    const doc = await Model.create(req.body); //Method - 2
    res.status(201).json({
      status: 'success',
      message: 'Data inserted successfully.',
      createdAt: req.requestTime,
      data: {
        data: doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppErrorHandler('No data found with that ID.', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Data updated successfully.',
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppErrorHandler('No data found with that ID.', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
