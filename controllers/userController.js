const AppErrorHandler = require('./../util/errorHandler');
const User = require('./../models/userModel');
const catchAsync = require('./../util/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Middlewares -----------------------------------------------------
exports.getMyProfile = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Route handlers
exports.updateMyProfile = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs pwd data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppErrorHandler(
        'This route is not for password updates. Please use /changePassword.',
        400
      )
    );
  }
  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'User details updated successfully',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndUpdate(req.user.id, {
    active: false
  });
  res.status(204).json({
    status: 'success',
    message: 'User account deleted',
    data: {
      user: deletedUser
    }
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

//No Create User function as we have sign up function
exports.createUser = (req, res) => {
  // Send Response
  res.status(500).json({
    status: 'fail',
    message: 'This route is not defined. Please use /v1/users/signup instead.'
  });
};

// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
