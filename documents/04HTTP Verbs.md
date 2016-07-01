**在用户详情页更新或删除。**

<br>

> npm install body-parser --save

<br>

> index.js

<br>
	
	var express = require('express')
	var app = express()
	
	var fs = require('fs')
	var path = require('path')
	var _ = require('lodash')
	var engines = require('consolidate')
	
	var bodyParser = require('body-parser')
	
	//找到某个用户的json文件
	function getUserFilePath (username) {
	  return path.join(__dirname, 'users', username) + '.json'
	}
	
	//获取某个用户的json以备使用传递，这里的用户json数据和user目录中的用户json数据时不一样的，进过了处理
	function getUser (username) {
	  //把用户从json文件中读取出来
	  var user = JSON.parse(fs.readFileSync(getUserFilePath(username), {encoding: 'utf8'}))
	  //处理user的属性
	  user.name.full = _.startCase(user.name.first + ' ' + user.name.last)
	  _.keys(user.location).forEach(function (key) {
	    user.location[key] = _.startCase(user.location[key])
	  })
	  return user
	}
	
	//更新用户，就是往用户的json文件中写数据
	//更新的本质是：删除该用户文件，再写入创建
	function saveUser (username, data) {
	  var fp = getUserFilePath(username)
	  fs.unlinkSync(fp) // delete the file
	  fs.writeFileSync(fp, JSON.stringify(data, null, 2), {encoding: 'utf8'})
	}
	
	//设置模板引擎
	app.engine('hbs', engines.handlebars)
	
	//到views目录中找hbs后缀的文件
	app.set('views', './views')
	app.set('view engine', 'hbs')
	
	//静态文件与实际使用文件之间的映射
	app.use('/profilepics', express.static('images'))
	
	//url的encode
	app.use(bodyParser.urlencoded({ extended: true }))
	
	app.get('/favicon.ico', function (req, res) {
	  res.end()
	})
	
	
	//请求所有用户
	app.get('/', function (req, res) {
	  var users = []
	  //读取目录
	  fs.readdir('users', function (err, files) {
	    //遍历目录下的每个文件
	    files.forEach(function (file) {
	      //读取json文件执行回调
	      fs.readFile(path.join(__dirname, 'users', file), {encoding: 'utf8'}, function (err, data) {
	        //数据验证，确保是JSON数据格式
	        var user = JSON.parse(data)
	        //处理用户的属性
	        user.name.full = _.startCase(user.name.first + ' ' + user.name.last)
	        //把用户方到本地内存的数组中
	        users.push(user)
	        //判断放到本地内存中的所有用户是否成功
	        //渲染模板，并把数据传过去
	        if (users.length === files.length) res.render('index', {users: users})
	      })
	    })
	  })
	})
	
	//请求某个用户
	app.get('/:username', function (req, res) {
	  //从路由参数中获取username的属性值
	  var username = req.params.username
	  //获取某个用户的json文件
	  var user = getUser(username)
	  //把某个用户的json数据传给模板
	  res.render('user', {
	    user: user,
	    address: user.location
	  })
	})
	
	//更新
	app.put('/:username', function (req, res) {
	  var username = req.params.username
	  var user = getUser(username)
	  user.location = req.body
	  saveUser(username, user)
	  res.end()
	})
	
	//删除
	//本质是把users目录下的该用户的json文件删除了
	app.delete('/:username', function (req, res) {
	  var fp = getUserFilePath(req.params.username)
	  fs.unlinkSync(fp) // delete the file
	  res.sendStatus(200)
	})
	
	var server = app.listen(3000, function () {
	  console.log('Server running at http://localhost:' + server.address().port)
	})

<br>

> views/user.hbs

<br>

	<!DOCTYPE html>
	<html lang="en">
	<head>
	  <meta charset="UTF-8">
	  <title>User Index</title>
	  <style>
	  * {
	    font-family: Helvetica, Arial, sans-serif;
	  }
	  div.pic {
	    padding-left: 2em;
	    font-size: 1.2em;
	    float: left;
	    height: 400px;
	  }
	  div a {
	    padding-left: 0.5em;
	  }
	  div.nav {
	    float: left;
	    width: 100%;
	    height: 100px;
	  }
	  img {
	    padding-right: 2em;
	  }
	  input {
	    font-size: 1em;
	  }
	  dt {
	    font-weight: bolder;
	    display: inline-block;
	    width: 4em;
	  }
	  dd {
	    display: inline-block;
	    margin-left: 0;
	    line-height: 1.5;
	  }
	  .edit {
	    display: none;
	  }
	  </style>
	</head>
	<body>
	
	  <div class="nav">
	    <a href="/">Back to Users List</a>
	  </div>
	
	  <div class="pic">
	    <img src="/profilepics/{{user.username}}_med.jpg">
	    <p>
	      <a href="#" onclick="edit()">Edit</a>
	      <a href="#" onclick="del()">Delete</a>
	    </p>
	  </div>
	
	  <h1>{{user.name.full}}</h1>
	  <dl>
	    <dt>Street</dt>
	    <dd class="view">{{address.street}}</dd>
	    <dd class="edit"><input id="street" type="text" value="{{address.street}}"></dd>
	    <br>
	    <dt>City</dt>
	    <dd class="view">{{address.city}}</dd>
	    <dd class="edit"><input id="city" type="text" value="{{address.city}}"></dd>
	    <br>
	    <dt>State</dt>
	    <dd class="view">{{address.state}}</dd>
	    <dd class="edit"><input id="state" type="text" value="{{address.state}}"></dd>
	    <br>
	    <dt>Zip</dt>
	    <dd class="view">{{address.zip}}</dd>
	    <dd class="edit"><input id="zip" type="text" value="{{address.zip}}"></dd>
	    <br>
	    <dt></dt>
	    <dd class="edit">
	      <input type="submit" value="Save" onclick="save()">
	      <input type="submit" value="Cancel" onclick="cancel()">
	    </dd>
	  </dl>
	 <!--可以使用jquery很好-->
	  <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	  <script>
	      
	    //更新时的视图切换
	    function edit () {
	      $('.view').hide()
	      $('.edit').show()
	    }
	      
	    //取消时的视图切换
	    function cancel () {
	      $('.view').show()
	      $('.edit').hide()
	    }
	      
	    //更新，PUT请求
	    function save () {
	      $.ajax('/{{user.username}}', {
	        method: 'PUT',
	        data: {
	          street: $('#street').val(),
	          city: $('#city').val(),
	          state: $('#state').val(),
	          zip: $('#zip').val()
	        },
	        complete: function () {
	          cancel()
	          location.reload()
	        }
	      })
	    }
	    
	    //删除，DELETE请求
	    function del () {
	      $.ajax('/{{user.username}}', {
	        method: 'DELETE',
	        complete: function () {
	          location = '/'
	        }
	      })
	    }
	  </script>
	
	</body>
	</html>

<br>

> localhost:3000

<br>



