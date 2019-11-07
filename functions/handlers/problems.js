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
            likeCount: doc.data().likeCount
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
    //NOT WORKING BUT NOT NECESSARY
    //if (req.body.body.trim() ===''){
    //  return res.status(400).json({body: 'Body must not be empty'});
   // }
  
    const newProblem = {
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt: new Date().toISOString()
    };
  
    db.collection("problems")
      .add(newProblem)
      .then((doc) => {
        res.json({ message: `document ${doc.id} successful` });
      })
  
      .catch((err) => {
        res.status(500).json({ error: "Something went wrong" });
        console.error(err);
      });
  }