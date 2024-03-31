import express from "express";
const router = express.Router();
// const authController = require('../controllers/auth') 
// const homeController = require('../controllers/home')
// const multer = require('multer');
// const { ensureAuth } = require('../middleware/ensureAuth');
// const upload = require("../middleware/multer");

import userController from "../controllers/user";
import stocksController from "../controllers/stocks";

// router.get('/', homeController.getIndex)
// router.post('/login', authController.postLogin)
// router.post('/register', authController.postRegister)
// router.get('/profile',authController.profileAuth)
// router.post('/logout', authController.logout)

// router.post('/submitContactForm', homeController.submitContactForm)
// router.post('/post',ensureAuth, upload.single("file"), homeController.createPost)
// router.put('/post', ensureAuth, upload.single("file"), homeController.updatePost)
// router.get('/post',homeController.getPosts)
// router.get('/post/:id',homeController.getPost)
// router.delete('/post/:id',ensureAuth,homeController.deletePost)

export default router