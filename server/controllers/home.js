// const Post = require('../models/Post')
// require('dotenv').config({path: './config/.env'})
// const nodemailer = require('nodemailer');
// const cloudinary = require("../middleware/cloudinary");

// exports.createPost = async (req, res, next) => {
//     try {
//       // Upload image to cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path);
//       const {title,summary,content} = req.body;
//       //create mongoDB post document
//       const postDoc = await Post.create({
//         title,
//         summary,
//         content,
//         cover: result.secure_url,
//         cloudinaryId: result.public_id,
//         author:req.user.id
//       });
//       console.log("Post has been added!");
//       res.json(postDoc);
//     } catch (err) {
//       console.log(err);
//       res.status(404)
//     }
// }

// exports.updatePost = async (req, res, next) => {
//   try {
//     const {id,title,summary,content} = req.body;
//     let newCover = null;
//     let postDoc = await Post.findById(id);
//      //validate if user is author
//       const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(req.user.id);
//       if (!isAuthor) {
//         return res.status(400).json('you are not the author');
//       }
//       if (req.file) {
//         // Upload new image to cloudinary
//         newCover = await cloudinary.uploader.upload(req.file.path);
//         //remove remove original file
//         await cloudinary.uploader.destroy(postDoc.cloudinaryId);
//       }
//       postDoc = {
//         title,
//         summary,
//         content,
//         cover: newCover ? newCover.secure_url : postDoc.cover,
//         cloudinaryId: newCover? newCover.public_id : postDoc.cloudinaryId,
//       }
//       await Post.updateOne({_id: id}, postDoc);
//       res.json(postDoc);
//   } catch (error) {
//     console.log(error);
//     res.status(404)
//   }
// }

// exports.deletePost = async (req, res, next) => {
//     try {
//       const id = req.params.id;
//       let postDoc = await Post.findById(id);
//       //validate if user is author
//       const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(req.user.id);
//       if (!isAuthor) {
//           return res.status(400).json('you are not the author');
//         }
//       if(postDoc.cloudinaryId){
//         await cloudinary.uploader.destroy(postDoc.cloudinaryId);
//       }
//       await Post.deleteOne({ _id: id });
//       console.log("Deleted Post");
//       res.status(200).json('Deleted post');
//     } catch (error) {
//       console.log(error)
//       res.status(404).json('Delete failed')
//     }
// }

// exports.getPosts = async (req, res, next) => {
//     try {
//       const skip = parseInt(req.query.skip) || 0; // default to skip 0 posts if query param is not provided
//       const limit = parseInt(req.query.limit) || 10; // default to 10 posts per page if limit query param is not provided
//       const startIndex = skip
//       const endIndex = skip + limit;
  
//       const posts = await Post.find()
//       //populates the author field with username. Post model has ref to User model author:{type:Schema.Types.ObjectId, ref:'User'} so it can auto pull the username field
//         .populate("author", ["username"]) 
//         .sort({ createdAt: -1 })
//         .skip(startIndex)
//         .limit(limit);
  
//       const totalPosts = await Post.countDocuments();
  
//       const pagination = {
//         // currentPage: page,
//         totalPages: Math.ceil(totalPosts / limit),
//         hasNextPage: endIndex < totalPosts,
//         hasPreviousPage: startIndex > 0,
//       };
  
//       res.json({ posts, pagination });
//     } catch (error) {
//       console.log(error);
//       res.status(404);
//     }
//   };

// exports.getPost = async (req, res, next) => {
//   try {
//     const {id} = req.params;
//     const postDoc = await Post.findById(id).populate('author', ['username']);
//     res.json(postDoc);
//   } catch (error) {
//     console.log(error);
//     res.status(404)
//   }

// }

// //forwards contact form to email
// exports.submitContactForm = async(req, res, next) => {
//   const { name, email, message } = req.body;
//   console.log('submitContactForm home controller user: ',process.env.user)
//   const transporter = nodemailer.createTransport({
//     host: 'smtp-relay.sendinblue.com',
//     port: 587,
//     auth: {
//       user: process.env.user,
//       pass: process.env.pass
//     }
//   });

//   const mailOptions = {
//     from: 'niallhm@gmail.com',
//     to: 'niallhm@gmail.com',
//     subject: 'New form submission',
//     text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Email sent');
//     res.status(200).send('Email sent successfully');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error sending email');
//   }
// };
  
