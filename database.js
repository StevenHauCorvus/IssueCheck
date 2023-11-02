import { MongoClient, ObjectId } from "mongodb";

import debug from "debug";
const debugDatabase = debug("app:Database");

let _db = null;

const newId = (str) => new ObjectId(str);

async function connect(){
    if(!_db){
        const connectionString = process.env.DB_URL;
        const dbName = process.env.DB_NAME;
        const client = await MongoClient.connect(connectionString);
        _db = client.db(dbName);
    }
    return _db;
}

async function ping(){
    const db = await connect();
    await db.command({ ping: 1 });
    debugDatabase("Pinged your deployment. You successfully connected to MongoDB!");
}







//USER FUNCTIONS

async function getAllUsers() {
    try {
        const db = await connect();
        const users = await db.collection("User").find().toArray();
        return users;
    } catch (err) {
        throw err;
    }
}

//Get user by ID
async function getUserById(id) {
    try {
        const db = await connect();
        const user = await db.collection("User").findOne({ _id: new ObjectId(id) });
        return user; // Return the retrieved user
    } catch (err) {
        throw err;
    }
}

//Login user
async function loginUser(email, password) {
  const db = await connect();
  const user = await db.collection('User').findOne({ email }); // Search for the user by email

  if (user && user.password === password) {
    return user;
  }

  return null;
}

//Update user
async function updateUser(id, userData) {
  const db = await connect(); // Replace with your database connection setup
  const collection = db.collection('User'); // Replace 'users' with your actual collection name

  // Search for the user by ID
  const user = await collection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return null;
  }

  // Update only the provided fields
  const updates = {};
  if (userData.password) {
    updates.password = userData.password;
  }
  if (userData.fullName) {
    updates.fullName = userData.fullName;
  }
  if (userData.givenName) {
    updates.givenName = userData.givenName;
  }
  if (userData.familyName) {
    updates.familyName = userData.familyName;
  }
  if (userData.role) {
    updates.role = userData.role;
  }

  // Add lastUpdated field with the current date and time
  updates.lastUpdated = new Date();

  // Update the user with the specified fields
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });

  return true;
}

//Delete user
async function deleteUser(userId) {
  const db = await connect(); // Replace connect with your actual connection function.
  const collection = db.collection('User');
  try {
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (user) {
      await collection.deleteOne({ _id: new ObjectId(userId) });
      return { success: true, userId };
    } else {
      return { success: false, userId, message: `User ${userId} not found.` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

//async function for user Register
async function findUserByEmail(email) {
    const db = await connect(); // Connect to your database (use the actual database library you are using)
  
    // Assuming 'User' is a valid collection in your database
    const user = await db.collection("User").findOne({ email });
    return user;
  }
  
async function createUser(userData) {
    const db = await connect(); // Connect to your database (use the actual database library you are using)
  
    // Assuming 'User' is a valid collection in your database
    const result = await db.collection("User").insertOne(userData);
    return result.insertedId; // Return the inserted user's ObjectId
  }
//______________________________________________
  



  //BUG FUNCTIONS
  
  async function getAllBugs() {
    try {
        const db = await connect();
        const bugs = await db.collection("Bug").find().toArray();
        return bugs;
    } catch (err) {
        throw err;
    }

  }

  async function getBugById(id) {
    const db = await connect();
    const bug = await db.collection('Bug').findOne({ _id: new ObjectId(id) });
    return bug;
  }

  async function newBug(bugData) {
    const db = await connect();
    const result = await db.collection('Bug').insertOne(bugData);
    return result;
  }

  async function updateBug(id, bugData) {
    try {
      const db = await connect(); // Assuming you have a function for connecting to the database
      const collection = db.collection('Bug'); // Change the collection name to match your database
  
      // Check if the Bug ID is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return { status: 400, response: { error: `Invalid Bug ID: ${id}` } };
      }
  
      // Search for the Bug by ID
      const bug = await collection.findOne({ _id: new ObjectId(id) });
  
      if (!bug) {
        // Bug not found
        return { status: 404, response: { error: `Bug ${id} not found.` } };
      }
  
      // Update only the provided fields
      const updateFields = {};
  
      if (bugData.title) {
        updateFields.title = bugData.title;
      }
  
      if (bugData.description) {
        updateFields.description = bugData.description;
      }
  
      if (bugData.stepsToReproduce) {
        updateFields.stepsToReproduce = bugData.stepsToReproduce;
      }
  
      // Set the lastUpdated field to the current date and time
      updateFields.lastUpdated = new Date();
  
      // Update the bug in the database
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
  
      return { status: 200, response: { message: `Bug ${id} updated!`, bugId: id } };
    } catch (error) {
      console.error('Error updating bug:', error);
      return { status: 500, response: { error: 'Internal server error' } };
    }
  }

  async function classifyBug(bugId, classification) {
    try {
      const db = await connect(); // Establish the database connection
      const collection = db.collection('Bug');
  
      const bug = await collection.findOne({ _id: bugId });
  
      if (!bug) {
        return { error: `Bug ${bugId} not found.` };
      }
  
      // Update bug fields
      bug.classification = classification;
      bug.classifiedOn = new Date();
      bug.lastUpdated = new Date();
  
      // Save the updated bug
      await collection.updateOne({ _id: bugId }, { $set: bug });
  
      return { message: `Bug ${bugId} classified!`, bugId };
    } catch (error) {
      throw new Error('Database error');
    }
  }
  


ping();


export {connect, ping, newId,
  getAllUsers,getUserById,createUser,findUserByEmail,loginUser,updateUser,deleteUser,
  getAllBugs,getBugById,newBug,updateBug,classifyBug}