const express = require('express');

const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/me', authController.protect, viewController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
); // For URL Encoding

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/tour/:tourSlug', viewController.getTour);
router.get('/login', viewController.getLoginForm);

module.exports = router;
