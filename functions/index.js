const functions = require('firebase-functions');
const admin =require('firebase-admin');

admin.initializeApp();

const express=require("express");
const app= express();

app.get('/problems',(req,res)=> {
  admin
    .firestore()
    .collection("problems")
    .orderBy("createdAt",'desc')
    .get()
    .then((data) => {
      let problems = [];
      data.forEach((doc) => {
        problems.push({
          problemId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt

        });
      });
      return res.json(problems);
    })
   .catch(err => console.error(err));
});

app.post('/problem', (req,res) => {

  const newProblem = {  
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  admin
    .firestore()
    .collection('problems')
    .add(newProblem)
    .then((doc) => {
      res.json({message: 'document successful'})
    })

    .catch((err) =>{
      res.status(500).json({error:"Theres an error"})
      console.error(err);
    });
});



exports.api = functions.https.onRequest(app);