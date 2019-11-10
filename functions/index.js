const functions = require("firebase-functions");

const app = require("express")();

const FBAuth= require('./util/fbAuth');

const {getAllProblems, postOneProblem }= require('./handlers/problems');
const {signup, login , uploadImage,addUserDetails} = require('./handlers/users');

//problem route
app.get('/problems',getAllProblems );
app.post("/problem", FBAuth, postOneProblem );
app.post('/user/image',FBAuth, uploadImage)
app.post('/user',FBAuth,addUserDetails)

//user route
app.post("/signup",signup);
app.post('/login',login);


exports.api = functions.https.onRequest(app);
