const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

//Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Login needed after this middleware
router.use(authController.protect);

router.patch('/changePassword', authController.changePassword);
router.get('/me', userController.getMyProfile, userController.getUser);
router.patch(
  '/updateMyProfile',
  userController.uploadUserPhoto,
  userController.resizeUserImage,
  userController.updateMyProfile
);
router.delete('/deleteMyAccount', userController.deleteMyAccount);

// Only Admin can perform the actions after this middleware
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
