import express from 'express';
import debug from 'debug';
const debugUser = debug('app:User');
debugUser.color = '63';
import {getAllUsers,getUserById,createUser,findUserByEmail,loginUser,updateUser,deleteUser} from '../../database.js';
import bcrypt from 'bcrypt';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { validId } from '../../middleware/validId.js';
import { isLoggedIn, fetchRoles, mergePermissions, hasPermission } from '@merlin4/express-auth';
const router = express.Router();


//Authentication stuff
async function issueAuthToken(user){
    const payload = {_id: user._id, email: user.email, role: user.role};
    const secret = process.env.JWT_SECRET;
    const options = {expiresIn:'1h'};


    const roles = await fetchRoles(user, role => findRoleByName(role));

    // roles.forEach(role => {
    //     debugUser(`The users role is ${(role.name)} and has the following permissions: ${JSON.stringify(role.permissions)}`);
    // });

    const permissions = mergePermissions(user, roles);
    payload.permissions = permissions;

    //debugUser(`The users permissions are ${permissions}`);

    const authToken = jwt.sign(payload, secret, options);
    return authToken;
}


function issueAuthCookie(res, authToken){
    const cookieOptions = {httpOnly:true,maxAge:1000*60*60};
    res.cookie('authToken',authToken,cookieOptions);
}

//step 1: define new user schema
const newUserSchema = Joi.object({
    fullName:Joi.string().trim().min(1).max(50).required(),
    password:Joi.string().trim().min(8).max(50).required(),
    email:Joi.string().trim().email().required(),
});

const loginUserSchema = Joi.object({
    email:Joi.string().trim().email().required(),
    password:Joi.string().trim().min(8).max(50).required()
});

const updateUserSchema = Joi.object({
    fullName:Joi.string().trim().min(1).max(50),
    password:Joi.string().trim().min(8).max(50),
});



//List Users
router.get('/list', async (req, res) => {
    debugUser('Getting all users');
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Get user by ID
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await getUserById(userId);
        if (user) {
            res.json(user); // Send the user data as JSON
        } else {
            res.status(404).json({ error: `User ${userId} not found.` }); // User not found response
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

 //Register new user
router.post("/register", async (req, res) => {
    try {
      const { email, password, fullName, givenName, familyName, role } = req.body;
  
      if (!email || !password || !fullName || !givenName || !familyName || !role) {
        res.status(400).json({ error: "All fields are required." });
        return;
      }
  
      // Check if a user with the same email already exists in the database
      const existingUser = await findUserByEmail(email);
  
      if (existingUser) {
        res.status(400).json({ error: "Email already registered." });
        return;
      }
  
      // If all checks pass, create a new user
      const newUser = {
        email,
        password,
        fullName,
        givenName,
        familyName,
        role,
        creationDate: new Date(),
      };
  
      // Call the createUser function to save the user to the database
      const userId = await createUser(newUser);
  
      res.status(200).json({ message: "New user registered!", userId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Registration failed" });
    }
});

//Login user
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter your login credentials.' });
      }
  
      const user = await loginUser(email, password);
  
      if (user) {
        const userId = user._id; // Assuming you have a unique user ID
        return res.status(200).json({ message: 'Welcome back!', userId });
      } else {
        return res.status(400).json({ error: 'Invalid login credential provided. Please try again.' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

//Update user
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      // Check if the provided user ID is a valid ObjectId
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid User ID' });
      }
  
      // Call the updateUser function to handle the update
      const updateResult = await updateUser(userId, req.body);
  
      if (!updateResult) {
        return res.status(404).json({ error: `User ${userId} not found.` });
      }
  
      res.status(200).json({ message: `User ${userId} updated!`, userId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

//Delete user
router.delete('/:userId', async (req, res) => {
    const { userId } = req.params;
    const deleteResult = await deleteUser(userId);
  
    if (deleteResult.success) {
      res.status(200).json({ message: `User ${userId} deleted!`, userId });
    } else {
      res.status(404).json({ error: deleteResult.message });
    }
  });

export {router as UserRouter}