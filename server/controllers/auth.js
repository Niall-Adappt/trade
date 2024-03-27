// const User = require('../models/User')
// const { jwt } = require('../config/jwt');
// require('dotenv').config({path: './config/.env'})
// // const validator = require('validator')

// const bcrypt = require('bcryptjs');
// const salt = bcrypt.genSaltSync(10);

//  exports.postLogin = async (req, res, next) => {
//   const {username,password} = req.body;
//   const userDoc = await User.findOne({username});
//   const passOk = bcrypt.compareSync(password, userDoc.password);
//   if (passOk) {
//     // logged in
//     jwt.sign({username,id:userDoc._id}, process.env.jwtSecret, {}, (err,token) => {
//       if (err) throw err;
//       res.cookie('token', token).json({
//         id:userDoc._id,
//         username,
//       });
//     });
//   } else {
//     res.status(400).json('wrong credentials');
//   }
// }

//  exports.postRegister = async (req, res, next) => {
//     const {username,password} = req.body;

//     const checkUserExists = (req) => {
//       const existingUser = User.findOne(//{$or: [
//         // {email: req.body.email},
//         {username: req.body.username}
//       // ]}
//       );
//       return existingUser;
//     };
  
//     try{
//       checkUserExists(req).then(user => {
//         if(user){
//           console.log(user)
//           res.status(400).json('username is taken')
//         } else {
//             User.create({
//             username: username.toLowerCase(),
//             password:bcrypt.hashSync(password,salt),
//           }).then(userDoc => res.json(userDoc));
//         }
//       })
//     } catch(e) {
//       console.log(e);
//       res.status(400).json(e);
//     }
//   }

// exports.profileAuth = function(req, res, next){ //should be async
//     const {token} = req.cookies;
//     if(!token){
//       res.json({})
//     }else {
//       try {
//         jwt.verify(token, process.env.jwtSecret, {}, (err,info) => {
//           if (err) throw err;
//           res.json(info);
//         });
//       } catch (error) {
//         console.log(error)
//       }
//     }
// }

// exports.logout = function(req, res, next){
//   res.cookie('token', '').json('ok');
// }