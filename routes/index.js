var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/nipple',function(req,res,next){
	res.render('nipple');
});

router.get('/teleop',function(req,res,next){
	res.render('teleop');
});

router.get('/video',function(req,res,next){
	res.render('video');
});


module.exports = router;
