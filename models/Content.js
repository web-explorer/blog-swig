/**
 * Created by Administrator on 2019/4/11.
 */
var mongoose = require('mongoose');
var contentsSchema = require('../schemas/contents');

module.exports = mongoose.model('Content',contentsSchema);