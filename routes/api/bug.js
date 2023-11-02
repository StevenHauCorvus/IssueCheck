import express from 'express';
import debug from 'debug';
const debugUser = debug('app:User');
debugUser.color = '63';
import {getAllBugs,getBugById,newBug,updateBug,classifyBug} from '../../database.js';
import bcrypt from 'bcrypt';
import { validBody } from '../../middleware/validBody.js';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { validId } from '../../middleware/validId.js';
import { isLoggedIn, fetchRoles, mergePermissions, hasPermission } from '@merlin4/express-auth';
const router = express.Router();


//Authentication stuff
async function issueAuthToken(bug){
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


//Get all Bugs
router.get('/list', async (req, res) => {
  const bugs = await getAllBugs();
    res.json(bugs);
});

//Get Bug by ID 
router.get('/:bugId', async (req, res) => {
    try {
      const bugId = req.params.bugId;
      const bug = await getBugById(bugId);
  
      if (!bug) {
        // If no bug is found, return a 404 response with an error message
        res.status(404).json({ error: `Bug ${bugId} not found.` });
      } else {
        // Send the bug data as a JSON response
        res.json(bug);
      }
    } catch (err) {
      // Handle database errors or promise rejections
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //Create a new Bug
  router.post('/new', async (req, res) => {
    try {
      // Check if the required data is present in the request body
      const { title, description, stepsToReproduce } = req.body;
      if (!title || !description || !stepsToReproduce) {
        return res.status(400).json({ error: "Missing or invalid data" });
      }
  
      // Create a new bug report
      const newBugData = {
        title,
        description,
        stepsToReproduce,
        creationDate: new Date(),
      };
  
      // Save the new bug to the database using the newBug function
      const result = await newBug(newBugData);
  
      res.status(200).json({ message: "New bug reported!", bugId: result.insertedId });
    } catch (error) {
      // Handle database errors and promise rejections
      res.status(500).json({ error: "Internal server error" });
    }
  });


  //Update a Bug
  router.put('/:bugId', async (req, res) => {
    const bugId = req.params.bugId;
    const bugData = req.body;
  
    const { status, response } = await updateBug(bugId, bugData);
  
    res.status(status).json(response);
  });

  router.put('/:bugId/classify', async (req, res) => {
    try {
      const bugId = req.params.bugId;
      const { classification } = req.body;
  
      // Call the classifyBug function to handle bug classification
      const result = await classifyBug(bugId, classification);
  
      res.status(200).json(result); // Respond with the result from classifyBug
    } catch (error) {
      res.status(400).json({ error: 'Invalid data' });
    }
  });

  

  





export {router as BugRouter}