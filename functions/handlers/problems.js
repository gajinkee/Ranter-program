const {db}=require('../util/admin');


exports.getAllProblems = (req, res) => {
    db.collection("problems")
      .orderBy("createdAt", "desc")
      .get()
      .then(data => {
        let problems = [];
        data.forEach(doc => {
          problems.push({
            problemId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: doc.data().createdAt,
            commentCount: doc.data().commentCount,
            likeCount: doc.data().likeCount,
            userImage: doc.data().userImage
          });
        });
        return res.json(problems);
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code});
      });  
  
  }

  exports.postOneProblem =(req, res) => {
    
    if (req.body.body.trim() === ''){
      return res.status(400).json({body: 'Body must not be empty'});
    }
  
    const newProblem = {
      body: req.body.body,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0

    };
  
    db.collection('problems')
      .add(newProblem)
      .then((doc) => {
        const resProblem=newProblem;
        resProblem.problemId= doc.id;
        res.json(resProblem);
      })
  
      .catch((err) => {
        res.status(500).json({ error: "Something went wrong" });
        console.error(err);
      });
  }
  //fetching a problem
  exports.getProblem = (req,res) =>{
    let problemData={};
    db.doc(`/problems/${req.params.problemId}`).get()
    .then(doc=>{
      if(!doc.exists){
        return res.status(404).json({error:'problem not found'})

      }
      problemData=doc.data();
      problemData.problemId=doc.id;
      return db.collection('comments').orderBy('createdAt','desc').where('problemId','==',req.params.problemId).get()

    })
    .then((data)=>{
      problemData.comments=[];
      data.forEach(doc =>{
        problemData.comments.push(doc.data())
      });
      return res.json(problemData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code }); 
    });
  };
  //comment on a comment
  exports.commentOnProblem =(req,res) =>{
    if(req.body.body.trim() ==='') return res.status(400).json({comment: 'must not be empty'});

    const newComment={
      body:req.body.body,
      createdAt: new Date().toISOString(),
      problemId:req.params.problemId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };

    db.doc(`/problems/${req.params.problemId}`).get()
    .then(doc=>{
      if(!doc.exists){
        return res.status(404).json({error: 'problem not found'});

      }
      return doc.ref.update({commentCount: doc.data().commentCount+1});
    })
    .then(()=>{
     return db.collection('comments').add(newComment);
    })
      
    .then(()=>{
      res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'something went wrong' }); 
    });
  }
exports.likeProblem=(req,res) =>{
  const likeDocument= db.collection('likes')
  .where('userHandle','==',req.user.handle)
  .where('problemId','==',req.params.problemId).limit(1);

  const problemDocument= db.doc(`/problems/${req.params.problemId}`);

  let problemData;

  problemDocument
  .get()
  .then(doc =>{
    if(doc.exists){
      problemData=doc.data();
      problemData.problemId=doc.id;
      return likeDocument.get();
    }else{
      return res.status(404).json({error:"problem not found"});

    } 
  })
  .then(data =>{
    if(data.empty){
      return db.collection('likes').add({
        problemId: req.params.problemId,
        userHandle: req.user.handle
      })
      .then(()=>{
        problemData.likeCount++
        return problemDocument.update({likeCount: problemData.likeCount})        
      })
      .then(()=>{
        return res.json(problemData)
      });
    }else{
      return res.status(400).json({error: 'problem already liked'});

    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.code }); 
  });
};

exports.unlikeProblem=(req,res) =>{
  const likeDocument= db.collection('likes')
  .where('userHandle','==',req.user.handle)
  .where('problemId','==',req.params.problemId).limit(1);

  const problemDocument= db.doc(`/problems/${req.params.problemId}`);

  let problemData;

  problemDocument
  .get()
  .then(doc =>{
    if(doc.exists){
      problemData=doc.data();
      problemData.problemId=doc.id;
      return likeDocument.get();
    }else{
      return res.status(404).json({error:"problem not found"});

    } 
  })
  .then(data=>{
    if(data.empty){
      return res.status(400).json({error: 'problem not liked'});
      
    }else{
     return db.doc(`/likes/${data.docs[0].id}`).delete()
     .then(()=>{
       problemData.likeCount--;
       return problemDocument.update({likeCount:problemData.likeCount})
     })
     .then(()=>{
       res.json(problemData);
     })

    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.code }); 
  });
};

//delete problem
exports.deleteProblem=(req,res)=>{
  const document = db.doc(`/problems/${req.params.problemId}`);
  document.get()
    .then(doc =>{
      if(!doc.exists){
        return res.status(404).json({error:'problem not found'});

      }
      if(doc.data().userHandle !== req.user.handle){
        return res.status(403).json({error:'unauthorised'});
      }else{
        return document.delete();
      }
    })
    .then(()=>{
      res.json({message: 'problem deleted'});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code }); 
    });
}