const axios = require('axios');

const Tour = require('./../models/tourModel');
const catchAsync = require('./../util/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/tours/'
    });
    // 2) Build template
    // 3) Render that template using the tour data from step 1
    res.status(200).render('overview', {
      title: 'All Tours',
      tours: result.data.data.data
    });
  } catch (err) {
    console.log(err.response.data);
  }
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data for requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.tourSlug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  // 2) Build template
  // 3) Render that template using the tour data from step 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log in to your account'
  });
};
