var express = require('express')
var app = express()


var fs = require('fs')
var _ = require('lodash')
var engines = require('consolidate')

var users = []

fs.readFile('users.json', {encoding: 'utf8'}, function(err, data){
    if(err) throw err
    
    JSON.parse(data).forEach(function(user){
        user.name.full = _.startCase(user.name.first + ' ' + user.name.last)
        users.push(user)
    })
})

//当使用hbs后缀的文件时，使用engines.handlebars这个对象
app.engine('hbs', engines.handlebars)

//到view目录下找以jade为后缀名的文件
app.set('views', './views')
app.set('view engine', 'hbs')

//使用静态文件
//这里做了一个映射，每次请求profilepics下的文件的时候，就到images目录中去找
app.use('/profilepics', express.static('images'))

//返回index.jade,并把内存中的users传递给index.jade
//index.jade就是一个模板
app.get('/', function(req, res){
    res.render('index', {users: users})
}) 

app.get(/big.*/, function(req, res, next){
    console.log('big user access')
    next()
})

app.get('/:username', function(req, res){
    var username = req.params.username
    res.render('user', {username: username})
})


var server = app.listen(3000, function(){
    console.log('Server running at http://localhost:' + server.address().port)
})