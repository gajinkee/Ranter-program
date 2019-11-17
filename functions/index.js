const functions = require("firebase-functions");

const app = require("express")();

const FBAuth= require('./util/fbAuth');

const cors= require('cors');
app.use(cors());

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
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch((err) => {
        console.error(err);
      });
});
exports.deleteNotificationOnUnlike =  functions.firestore.document('likes/{id}')
.onDelete((snapshot)=>{
   return db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .catch((err) => {
        console.error(err);
        return;
      });
})
exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
.onCreate((snapshot)=>{
    return db.doc(`/problems/${snapshot.data().problemId}`).get()
    .then(doc=>{
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch((err) => {
        console.error(err);
        return; 
      });
})
exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate((change)=>{
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrll){
            console.log('image has change');
            const batch=db.batch();
            return db.collection('problems').where('userHandle','==',change.before.data().handle).get()
                .then((data)=>{
                    data.forEach(doc =>{
                        const problem=db.doc(`/problems/${doc.id}`);
                        batch.update(problem, {userImage: change.after.data().imageUrl});
                    })
                    return batch.commit();
            });
        }else return true;
    });
exports.onProblemDelete = functions.firestore.document('/problems/{problemId}')
.onDelete((snapshot,context)=>{
    const problemId=context.params.problemId;
    const batch = db.batch();
    return db.collection('comments').where('problemId','==',problemId).get()
    .then(data=>{
        data.forEach(doc=>{
            batch.delete(db.doc(`/comments/${doc.id}`));
        })
        return db.collection('likes').where('problemId','==',problemId).get();
    })
    .then(data=>{
        data.forEach(doc=>{
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where('problemId','==',problemId).get();
    })
    .then(data=>{
        data.forEach(doc=>{
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch((err) => {
        console.error(err); 
      });
})