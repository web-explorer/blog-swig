/**
 * Created by Administrator on 2019/4/11.
 */
var express = require('express');
var router = express.Router();

var User = require('../models/User');
var Category = require('../models/Category');
var Content = require('../models/Content');

/*router.get('/user',function(req,res,next){
    res.send('ADMIN-user');
});*/
router.use(function(req,res,next){
    if(!req.userInfo.isAdmin){
        //如果当前用户是非管理员
        res.send('对不起，只有管理员才可以进入后台管理！');
        return;
    }
    next();
});

/*
* 首页
* */
router.get('/',function(req,res,next){
    res.render('admin/index',{
        userInfo:req.userInfo
    });
});

/*
* 用户管理
* */
router.get('/user',function(req,res,next){
    /*
    * 从数据库中读取所有的用户数据
    *
    * limit(Number):限制获取的数据条数
    *
    * skip(2):忽略数据的条数（从第三条开始取）
    *
    * 每页显示2条
    * 1：1-2 skip:0 -> (当前页-1) * limit
    * 2: 3-4 skip:2
    *
    * */

    var page = Number(req.query.page || 1);
    var limit = 2;

    User.count().then(function(count){

        //计算总页数
        var pages = Math.ceil(count / limit);
        //取值不能超过pages
        page = Math.min(page,pages);
        //取值不能小于1
        page = Math.max(page,1);

        var skip = (page - 1) * limit

        User.find().limit(limit).skip(skip).then(function(users){
            res.render('admin/user_index',{
                userInfo:req.userInfo,
                users:users,
                count:count,
                pages:pages,
                limit:limit,
                page:page,
                belong:'user'
            });
        });
    });
});

/*
*分类首页
* */
router.get('/category',function(req,res,next){

    var page = Number(req.query.page || 1);
    var limit = 5;

    Category.count().then(function(count){

        //计算总页数
        var pages = Math.ceil(count / limit);
        //取值不能超过pages
        page = Math.min(page,pages);
        //取值不能小于1
        page = Math.max(page,1);

        var skip = (page - 1) * limit

        /*
        * 1 : 升序
        * -1 : 降序
        * */
        Category.find().sort({_id : -1}).limit(limit).skip(skip).then(function(categories){
            res.render('admin/category_index',{
                userInfo:req.userInfo,
                categories:categories,
                count:count,
                pages:pages,
                limit:limit,
                page:page,
                belong:'category'
            });
        });
    });
});

/*
*修改分类
* */
router.get('/category/edit',function(req,res){

    //获取要修改的分类信息，并且用表单的形式展现出来
    var id = req.query.id || '';

    //获取要修改的分类信息
    Category.findOne({
        _id : id
    }).then(function(categoryInfo){
        if(!categoryInfo){
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '分类信息不存在！'
            });
            return Promise.reject();
        }else{
            res.render('admin/category_edit',{
                userInfo : req.userInfo,
                categoryInfo : categoryInfo
            });
        }
    });

});

/*
* 删除分类
* */
router.get('/category/delete',function(req,res){
    var id = req.query.id || '';
    Category.remove({
        _id : id
    }).then(function(){
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '删除成功！',
            url : '/admin/category'
        });
    });
});

/*
* 修改分类-保存
* */
router.post('/category/edit',function(req,res){

    var id = req.query.id || '';
    var name = req.body.name || '';

    if(name == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '名称不能为空！'
        });
        return;
    }

    Category.findOne({
        _id : id
    }).then(function(categoryInfo){
        if(!categoryInfo){
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '分类信息不存在！'
            });
            return Promise.reject();
        }else{
            //当用户没有做任何的修改提交的时候
            if(name == categoryInfo.name){
                res.render('admin/success',{
                    userInfo : req.userInfo,
                    message : '修改成功！',
                    url : '/admin/category'
                });
                return Promise.reject();
            }else{
                //要修改的分类名是否已经在数据库中存在
                return Category.findOne({
                    _id : {$ne : id},
                    name : name
                });
            }
        }
    }).then(function(sameCategory){
        if(sameCategory){
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '数据库中已经存在同名分类！'
            });
            return Promise.reject();
        }else{
            return Category.update({
                _id : id
            },{
                name : name
            });
        }
    }).then(function(){console.log(111);
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '修改成功！',
            url : '/admin/category'
        });
    });

});

/*
* 添加分类
* */
router.get('/category/add',function(req,res){

    res.render('admin/category_add',{
        userInfo : req.userInfo
    });

});

/*
* 添加分类-保存
* */
router.post('/category/add',function(req,res){

    var name = req.body.name || '';

    if(name == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '名称不能为空！'
        });
        return;
    }

    //数据库中是否已经存在同名的分类
    Category.findOne({
        name : name
    }).then(function(rs){
        if(rs){
            //数据库中已经存在该分类了
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '分类已经存在了！'
            });
            return Promise.reject();
        }else{
            //数据库中不存在该分类，可以保存
            return new Category({
                name : name
            }).save();
        }
    }).then(function(newCategory){
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '分类保存成功！',
            url : '/admin/category'
        });
    });

});

/*
* 内容首页
* */
router.get('/content',function(req,res,next){

    var page = Number(req.query.page || 1);
    var limit = 5;

    Content.count().then(function(count){

        //计算总页数
        var pages = Math.ceil(count / limit);
        //取值不能超过pages
        page = Math.min(page,pages);
        //取值不能小于1
        page = Math.max(page,1);

        var skip = (page - 1) * limit

        /*
         * 1 : 升序
         * -1 : 降序
         * */
        Content.find().sort({_id : -1}).limit(limit).skip(skip).populate(['category','user']).then(function(contents){
            res.render('admin/content_index',{
                userInfo:req.userInfo,
                contents:contents,
                count:count,
                pages:pages,
                limit:limit,
                page:page,
                belong:'content'
            });
        });
    });
});

/*
* 内容添加页面
* */
router.get('/content/add',function(req,res){

    Category.find().then(function(categories){
        res.render('admin/content_add',{
            userInfo : req.userInfo,
            categories : categories
        });
    });

});

/*
* 保存内容
* */
router.post('/content/add',function(req,res){

    var title = req.body.title || '';
    var category = req.body.category || '';

    if(req.body.category == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '内容分类不能为空！'
        });
        return;
    }

    if(title == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '内容标题不能为空！'
        });
        return;
    }

    //数据库中是否已经存在同标题的内容
    Content.findOne({
        category : category,
        title : title
    }).then(function(rs){
        if(rs){
            //数据库中已经存在该标题的内容了
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '该分类下拥有此标题的内容已经存在了！'
            });
            return Promise.reject();
        }else{
            //数据库中不存在该标题的内容，可以保存
            return new Content({
                user : req.userInfo._id.toString(),
                category : req.body.category,
                title : req.body.title,
                description : req.body.description,
                content : req.body.content
            }).save();
        }
    }).then(function(newContent){
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '内容保存成功！',
            url : '/admin/content'
        });
    });

});

/*
* 修改内容
* */
router.get('/content/edit',function(req,res){

    //获取要修改的内容信息，并且用表单的形式展现出来
    var id = req.query.id || '';
    var contentInfo = {};

    //获取要修改的内容信息
    Content.findOne({
        _id : id
    }).populate('category').then(function(rs){
        if(!rs){
            res.render('admin/error',{
                userInfo : req.rs,
                message : '内容信息不存在！'
            });
            return Promise.reject();
        }else{
            contentInfo = rs;
            return Category.find();
        }
    }).then(function(categories){
        res.render('admin/content_edit',{
            userInfo : req.userInfo,
            contentInfo : contentInfo,
            categories : categories
        });
    });

});

/*
* 修改内容 - 保存
* */
router.post('/content/edit',function(req,res){

    var id = req.query.id || '';
    var category = req.body.category || '';
    var title = req.body.title || '';
    var description = req.body.description || '';
    var content = req.body.content || '';

    if(category == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '分类不能为空！'
        });
        return;
    }

    if(title == ''){
        res.render('admin/error',{
            userInfo : req.userInfo,
            message : '标题不能为空！'
        });
        return;
    }

    Content.findOne({
        _id : id
    }).populate().then(function(contentInfo){
        if(!contentInfo){
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '内容信息不存在！'
            });
            return Promise.reject();
        }else{
            //当用户没有做任何的修改提交的时候
            if(category == contentInfo.category._id && title == contentInfo.title && description == contentInfo.description && content == contentInfo.content){
                res.render('admin/success',{
                    userInfo : req.userInfo,
                    message : '修改成功！',
                    url : '/admin/content'
                });
                return Promise.reject();
            }else{
                //要修改的分类名是否已经在数据库中存在
                return Content.findOne({
                    _id : {$ne : id},
                    title : title
                });
            }
        }
    }).then(function(sameTitleContent){
        if(sameTitleContent){
            res.render('admin/error',{
                userInfo : req.userInfo,
                message : '数据库中已经存在同标题内容！'
            });
            return Promise.reject();
        }else{
            return Content.update({
                _id : id
            },{
                category : category,
                title : title,
                description : description,
                content : content
            });
        }
    }).then(function(){
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '修改成功！',
            url : '/admin/content'
        });
    });

});

/*
* 删除内容
* */
router.get('/content/delete',function(req,res){
    var id = req.query.id || '';
    Content.remove({
        _id : id
    }).then(function(){
        res.render('admin/success',{
            userInfo : req.userInfo,
            message : '删除成功！',
            url : '/admin/content'
        });
    });
});

module.exports = router;