const functions = require("firebase-functions");

const app = require("express")();

const FBAuth= require('./util/fbAuth');

const {db}= require('./util/admin');

const {getAllProblems, postOneProblem, getProblem,commentOnProblem,likeProblem,unlikeProblem,deleteProblem }= require('./handlers/problems');
const {signup, login , uploadImage,addUserDetails,getAuthenticatedUser,getUserDetails,markNotificationsRead} = require('./handlers/users');

//problem route
app.get('/problems',getAllProblems );
app.post("/problem", FBAuth, postOneProblem );
app.get('/problem/:problemId',getProblem);
app.delete('/problem/:problemId',FBAuth,deleteProblem);

app.get('/problem/:problemId/like' ,FBAuth,likeProblem);
app.get('/problem/:problemId/unlike' ,FBAuth,unlikeProblem);
app.post('/problem/:problemId/comment' ,FBAuth,commentOnProblem);


//user route
app.post("/signup",signup);
app.post('/login',login);
app.post('/user/image',FBAuth, uploadImage);
app.post('/user',FBAuth,addUserDetails);
app.get('/user',FBAuth,getAuthenticatedUser);
app.get('/user/:handle',getUserDetails);
app.post('/notifications',FBAuth,markNotificationsRead);



exports.api = functions.https.onRequest(app);


exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
.onCreate((snapshot)=>{
   return db.doc(`/problems/${snapshot.data().problemId}`).get()
    .then(doc=>{
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                receipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read:false,
                problemId: doc.id
            });
        }
    })
    .then(()=>{
        return;
    })
    .catch((err) => {
        console.error(err);
        return; 
      });
});
exports.deleteNotificationOnUnlike =  functions.firestore.document('likes/{id}')
.onDelete((snapshot)=>{
   return db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(()=>{
        return;
    })
    .catch((err) => {
        console.error(err);
        return;
      });
})
exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
.onCreate((snapshot)=>{
    return db.doc(`/problems/${snapshot.data().problemId}`).get()
    .then(doc=>{
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                receipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read:false,
                problemId: doc.id
            });
        }
    })
    .then(()=>{
        return;
    })
    .catch((err) => {
        console.error(err);
        return; 
      });
})

