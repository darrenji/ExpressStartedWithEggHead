本节源代码参考这里：https://github.com/bclinkinbeard/egghead-getting-started-with-express/tree/10-mongodb-integration

<br>

> npm install mongodb --save

<br>

> 项目根目录下创建并拷贝user_list.json文件，这是作为数据库的数据源

<br>

**首先，把mongodb所在的bin目录设置成环境变量值。**

> 来到目录：C:\Program Files\MongoDB\Server\3.2\bin

<br>

> 把上面的目录设置成环境变量值

<br>

**接着，要在项目目录下打开mongodb。**

> 来到项目下，打开命令行窗口

<br>

> 运行：mongod --dbpath c:/data/db

<br>

c:/data/db是mongodb数据库的物理地址。正常情况下，此时命令行窗口显示"waiting for connection on port 27017",保持打开着。

<br>

**然后，就把user_list.json拷贝到mongodb数据库。**

> 来到项目下，再打开命令行窗口

<br>

> 运行：mongoimport --db test --collection users --drop --file user_list.json

<br>

> touch db.js

<br>

	var uri = 'mongodb://localhost:27017/test'
	
	var MongoClient = require('mongodb').MongoClient
	
	var findUsers = function(db, callback){
	    var cursor = db.collection('users').find()
	    
	    cursor.each(function(err, doc){
	        if(doc != null){
	            console.dir(doc)
	        } else {
	            callback()
	        }
	    })
	}
	
	MongoClient.connect(uri, function(err, db){
	    findUsers(db, function(){
	        db.close()
	    })
	})

以上，连接数据库，在回调函数中调用findUsers方法，其把数据库中的内容打印出来，并执行回调函数关闭数据库连接。

<br>

**现在，需要运行db.js这个文件，看数据库以及连接是否通**。

<br>

> node db.js

<br>

接着，**应该需要和mongodb交互了，这里需要用到一个库，叫做mongoose,它可以构造mongodb所需的、对用的model.**

<br>

> npm install mongoose --save

<br>

> db.js

<br>

	var uri = 'mongodb://localhost:27017/test'
	
	var mongoose = require('mongoose')
	mongoose.connect(uri)
	
	var db = mongoose.connection
	db.on('error', console.error.bind(console, 'connection error:'))
	db.once('open', function (callback) {
	  console.log('db connected')
	})
	
	var userSchema = mongoose.Schema({
	  username: String,
	  gender: String,
	  name: {
	    title: String,
	    first: String,
	    last: String,
	    full: String
	  },
	  location: {
	    street: String,
	    city: String,
	    state: String,
	    zip: Number
	  }
	})
	exports.User = mongoose.model('User', userSchema)
以上，通过User拿到的是数据库中的users。

<br>

**既然已经能拿到数据库中的users了，现在就把它们显示出来。**

<br>

> index.js

<br>

	var User = require('./db').User;

	...

	app.get('/', function (req, res) {
	    User.find({}, function(err, users){
	        res.render('index', { users: users})
	    })
	  
	})

<br>

> localhost:3000

<br>

> username.js

<br>

	var express = require('express')
	var helpers = require('./helpers')
	var fs = require('fs')
	
	var User = require('./db').User
	
	var router = express.Router({
	  mergeParams: true
	})
	
	router.use(function (req, res, next) {
	  console.log(req.method, 'for', req.params.username, 'at', req.path)
	  next()
	})
	
	router.get('/', function (req, res) {
	  var username = req.params.username
	  User.findOne({username: username}, function (err, user) {
	    res.render('user', {
	      user: user,
	      address: user.location
	    })
	  })
	})
	
	router.use(function (err, req, res, next) {
	  console.error(err.stack)
	  res.status(500).send('Something broke!')
	})
	
	router.put('/', function (req, res) {
	  var username = req.params.username
	
	  User.findOneAndUpdate({username: username}, {location: req.body}, function (err, user) {
	    res.end()
	  })
	})
	
	router.delete('/', function (req, res) {
	  var fp = helpers.getUserFilePath(req.params.username)
	  fs.unlinkSync(fp) // delete the file
	  res.sendStatus(200)
	})
	
	module.exports = router

<br>
















