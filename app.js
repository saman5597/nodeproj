const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); //Http Parameter Pollution
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppErrorHandler = require('./util/errorHandler');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global Middlewares

// Serving Static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet()); // XSS Scripting

app.use(cors());

// Req meta-data (req-time , status etc.) Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body-parsing , reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //will not accept data larger than 10kb
app.use(cookieParser());

// DATA SANITIZATION AGAINST NO-SQL QUERY INJECTIONS
app.use(mongoSanitize());

// DATA SANITIZATION AGAINST XSS(CROSS SITE SCRIPTING) ATTACKS - HTML Attacks
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'name',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'priceDiscount',
      'startDates'
    ]
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //Used in tour controller
  next();
});

// Prevents from Brute-force attack and Denial of service (Limit req from same API)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1hr window
  max: 100, // start blocking after 100 requests
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after an hour.'
  }
});
app.use('/api/v1/users', limiter);

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//Routes
app.use('/api/v1/tours', tourRouter); //Mounting the router
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);

// Handling Unhandled Routes - Should be in last in stack otherwise all routes will be routed to this route.
//Operational Error
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404; //Using Error Middleware
  next(
    new AppErrorHandler(`Can't find ${req.originalUrl} on this server.`, 404)
  );
});

// Global Error Handling  Middleware
app.use(globalErrorHandler);

module.exports = app;
