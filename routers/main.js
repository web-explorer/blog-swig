/**
 * Created by Administrator on 2019/4/11.
 */
var express = require('express');
var router = express.Router();

var Category = require('../models/Category');
var Content = require('../models/Content');

var basicData = {};

/*
* 处理通用数据
* */
router.use(function(req,res,next){
    basicData.userInfo = req.userInfo;
    Category.find().then(function(categories){
        basicData.categories = categories || [];
        next();
    });
});

/*
* 首页
* */
router.get('/',function(req,res){
    var data = {};
    data.userInfo = basicData.userInfo;
    data.categories = basicData.categories;


    data.limit = 4;
    data.page =  Number(req.query.page || 1);
    data.categoryId = req.query.categoryId;
    data.contents = [];
    data.count = 0;
    data.pages = 0

    var where = {};
    if(data.categoryId){
        where.category = data.categoryId;
    }

    Content.count().where(where).then(function(count){
        data.count = count;
        data.pages = Math.ceil(count / data.limit);
        var skip = (data.page - 1) * data.limit;

        return Content.find().where(where).limit(data.limit).skip(skip).sort({_id : -1}).populate('user');
    }).then(function(contents){
        data.contents = contents;console.log(data);
        res.render('main/index',data);
    });

});

/*
* 点击阅读全文进入文章展示页面
* */
router.get('/view',function(req,res){
    var data = {};
    data.userInfo = basicData.userInfo;
    data.categories = basicData.categories;

    data.content = {};
    var contentId = req.query.contentId || '';
    Content.findOne({
        _id: contentId
    }).populate('user').then(function(content){

        content.views++;
        content.save();

        data.content = content;console.log(data);
        res.render('main/view',data);
    });


});

module.exports = router;