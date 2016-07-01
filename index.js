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

//验证用户
function verifyUser(req, res, next){
    var fp = getUserFilePath(req.params.username)
    
    fs.exists(fp, function(yes){
        if(yes){
            next()
        } else {
            res.redirect('/error/' + req.params.username)
        }
    })
}

//下载用户的json文件
//req.path=*.json
app.get('*.json', function(req, res){
    res.download('./users' + req.path, 'othername')
})

//直接返回json数据
app.get('/data/:username', function(req, res){
    var username = req.params.username
    var user = getUser(username)
    res.json(user)
})

//路由的日志记录
app.all('/:username', function(req, res, next){
    console.log(req.method, 'for', req.params.username)
    next()
})


//请求某个用户
app.get('/:username', verifyUser, function (req, res) {
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

//上面这个路由出现错误就到这里来
app.get('/error/:username', function(req, res){
    res.status(404).send('no user named ' + req.params.username + ' found')
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