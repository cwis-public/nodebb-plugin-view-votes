(function() {

"use strict";

var NodeBB = require.main;
var async = require("async");
var winston = NodeBB.require('winston');
var db = NodeBB.require('./src/database');
var user = NodeBB.require('./src/user');

function getVoters(socket, data, callback) {
	if (!data || !data.pid || !data.cid) {
		return callback(new Error('[[error:invalid-data]]'));
	}

	async.waterfall([
		function (next) {
			/* we purposefully do not check if the user is admin or mod
			if (!isAdminOrMod) {
				return next(new Error('[[error:no-privileges]]'));
			}
			*/

			async.parallel({
				upvoteUids: function(next) {
					db.getSetMembers('pid:' + data.pid + ':upvote', next);
				},
				downvoteUids: function(next) {
					db.getSetMembers('pid:' + data.pid + ':downvote', next);
				}
			}, next);
		},
		function (results, next) {
			async.parallel({
				upvoters: function(next) {
					user.getUsersFields(results.upvoteUids, ['username', 'userslug', 'picture'], next);
				},
				upvoteCount: function(next) {
					next(null, results.upvoteUids.length);
				},
				downvoters: function(next) {
					user.getUsersFields(results.downvoteUids, ['username', 'userslug', 'picture'], next);
				},
				downvoteCount: function(next) {
					next(null, results.downvoteUids.length);
				}
			}, next);
		}
	], callback);
}

exports.init = function(params, callback) {
	winston.info("Allowing everyone to see down votes and up votes");

	var posts = NodeBB.require('./src/socket.io/posts.js');
	posts.getVoters = getVoters;
	return callback();
};

})();
