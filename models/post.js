const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: String,
    category: String,
    body: String,
    updated: String,
    date: String,
    summary: String,
    permalink: { type: String, unique: true }, // unique index for fast single-post lookup
    credit: String,
    code: String,
    author: String,
    mainimage: String,
    views: Number,
    headline: { type: String, default: 'off' }
});

//Compound index for category + date (used for paginated category queries)
postSchema.index({ category: 1, date: -1 });

postSchema.index({ views: -1 });

// 🔹 Optional: index on headline for filtering featured posts
postSchema.index({ headline: 1 });

var Post = module.exports = mongoose.model('Post', postSchema);
