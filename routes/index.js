const express = require('express')
var router = express.Router()
const mongo = require('mongodb')
const url = process.env.MONGODB_URI;
const db = require('monk')(url)
const expressHbs = require('express-handlebars')
var paginate = require('handlebars-paginate')
const urlx = require('url')
const moment = require('moment')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs');
const path = require('path');
const archiver = require('archiver'); 
const Post = require('../models/post');
const Category = require('../models/category');
const User = require('../models/user');
const Event = require('../models/event');

/*GET home */
router.get("/", async (req, res, next) => {
    try {
        const businessPosts = await Post.find({ category: 'Business' }).sort({ date: -1 }).limit(4).exec();
        const techPosts = await Post.find({ category: 'Technology' }).sort({ date: -1 }).limit(2).exec();
        const digital = await Post.find({ category: 'Digital' }).sort({ date: -1 }).limit(3).exec();
        const latestPosts = await Post.find({}).sort({ date: -1 }).limit(4).exec();
        const headlines = await Post.find({ headline: 'on' }).sort({ date: -1 }).limit(2).exec();
        const interviews = await Post.find({ category: 'Interviews' }).sort({ date: -1 }).limit(3).exec();
        const health = await Post.find({ category: 'Health And Fitness' }).sort({ date: -1 }).limit(3).exec();
        const sports = await Post.find({ category: 'Sports' }).sort({ date: -1 }).limit(6).exec();

        const categoriesToFetch = ['Travel', 'Entertainment', 'Lifestyle'];
        const inReviews = ['Movies','Reviews and Profiles', 'Shows'];
        const etl = await Post.find({ category: { $in: categoriesToFetch } }).sort({ date: -1 }).limit(5).exec();
        const reviews = await Post.find({ category: { $in: inReviews } }).sort({ date: -1 }).limit(4).exec();

        res.locals.metaTags = {
            summary: "The Brink News is your news, entertainment, music fashion website. We provide you with the latest breaking news and videos straight from the entertainment",
            keywords: ", home, uganda news, kampala news, breaking news",
            Ogimg: "/images/wa.png",
            Ogurl: "",
        };
        res.render("index", {
            title: "The Brink News | New day, New Stories",
            business: businessPosts,
            tech: techPosts,
            new: latestPosts,
            digital: digital,
            headlines: headlines,
            interviews: interviews,
            etl: etl,
            health: health,
            sports: sports,
            reviews: reviews
        });
    } catch (err) {
        next(err);
    }
});

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ start_date: 1 }).lean();

    // group events by year and month
    const groupedEvents = {};

    events.forEach((event) => {
      if (!event.start_date) return;

      const date = new Date(event.start_date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0 = Jan, 11 = Dec

      if (!groupedEvents[year]) groupedEvents[year] = {};

      if (!groupedEvents[year][month]) groupedEvents[year][month] = [];

      groupedEvents[year][month].push(event);
    });

    // Optional: convert month numbers to names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Build a structured array for Handlebars
    const eventsByYear = Object.keys(groupedEvents)
      .sort((a, b) => a - b) // ascending years
      .map((year) => ({
        year,
        months: Object.keys(groupedEvents[year])
          .sort((a, b) => a - b) // ascending month
          .map((m) => ({
            month: monthNames[m],
            events: groupedEvents[year][m]
          }))
      }));
      res.locals.metaTags = {
        html: ` js flexbox flexboxlegacy canvas canvastext webgl no-touch geolocation postmessage no-websqldatabase indexeddb hashchange history draganddrop websockets rgba hsla multiplebgs backgroundsize borderimage borderradius boxshadow textshadow opacity cssanimations csscolumns cssgradients cssreflections csstransforms csstransforms3d csstransitions fontface generatedcontent video audio localstorage sessionstorage webworkers no-applicationcache svg inlinesvg smil svgclippaths -webkit-`,
        body: "wp-singular article-template-default single single-article postid-220258 single-format-standard wp-theme-crack long-reads navbar-fixed-body no-splash",
        summary: "A rolling, directory of essential events in Uganda Kampala Jinja and beyond - handpicked by The brink news team",
        keywords: "events in kampala, kampala concerts, uganda events, nyege nyege, club events,brunch",
        Ogimg: "https://thebrinknews.com/events/kampala_events_directory_2026.jpg",
        Ogurl: "events",
        
    };

    res.render('events', { eventsByYear, title: 'The Brink Events Guide 2026 [Kampala]' });
  } catch (err) {
    console.error('Error fetching events from DB:', err);
    res.render('events', { eventsByYear: [], error: 'Failed to load events.' });
  }
});

function capitalizeText(inputString) {
  return inputString.replace(/\b\w/g, match => match.toUpperCase());
}

//miss uganda
router.get("/miss-uganda", (req, res, next) => {
    res.locals.metaTags = {
        summary: "Explore the history of Miss Uganda since independence and meet the former beauty queens who shaped Uganda’s culture and legacy. Current miss Uganda is Trivia Elle Muhoza",
        keywords: "miss uganda, miss world uganda, miss world Africa, miss uganda 2025",
        Ogimg: "https://thebrinknews.com/images/miss-uganda-queens/Trivia-Elle-Muhoza.webp",
        Ogurl: "miss-uganda",
        body: "home page-template page-template-page-home-new page-template-page-home-new-php page page-id-2401"
    };

        res.render("miss", {
            title: "Miss Uganda History",
        });
    });

//single category with pagination
router.get('/c/:category', async (req, res, next) => {
  try {
    // page number
    let page = parseInt(req.query.p) || 1;
    if (page < 1) page = 1;

    const pageSize = 12; // increase posts per page for more content
    const cat = capitalizeText(req.params.category);

    // Count total posts for pagination
    const totalPosts = await Post.countDocuments({ category: cat });

    // Fetch only the posts for this page
    const posts = await Post.find({ category: cat })
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(); // lean() improves performance for read-only queries

    // Meta tags
    res.locals.metaTags = {
      summary: `Page ${page} Articles posted in ${cat}`,
      keywords: `${cat}`,
      Ogimg: "/images/logo.png",
      Ogurl: `/c/${cat}`,
    };

    res.render('cat', {
      title: `${totalPosts} Articles in ${cat} | The Brink News`,
      posts,
      cat,
      pagination: {
        page,
        pageCount: Math.ceil(totalPosts / pageSize),
      },
    });

  } catch (err) {
    next(err);
  }
});


//author
router.get('/a/:author', async (req, res, next) => {
  try {
    const pageNombre = parseInt(req.query.p) || 1;
    const pageSize = 9;

    let cat = capitalizeText(req.params.author);
    const regex = new RegExp(cat.replace(/-/g, "\\s*"), "i");

    const skip = (pageNombre - 1) * pageSize;

    const [posts, userx, totalPostsCount] = await Promise.all([
      Post.find({ author: regex }).sort({ date: -1 }).skip(skip).limit(pageSize).lean(),
      User.findOne({ display_name: cat }).lean(),
      Post.countDocuments({ author: regex }),
    ]);

    const pageCount = Math.ceil(totalPostsCount / pageSize);

    // metatags
    res.locals.metaTags = {
      summary: `Articles posted or authored by ${cat}`,
      keywords: `${cat}`,
      Ogimg: `/images/bio/${cat}`,
      Ogurl: `/c/${cat}`,
    };

    res.render('cat', {
      title: `${totalPostsCount} Articles written by ${cat}`,
      posts,
      userx,
      pagination: { page: pageNombre, pageCount },
    });

  } catch (err) {
    next(err);
  }
});





/*GET Search*/
router.get("/search", (req, res, next) => {
    res.render("search", { title: "Search"});
});


//contact
router.get('/contact', (req, res, next) => {
    res.locals.metaTags = {
        summary: "Contact us",
        keywords: "Contact us, address, location, brink news contacts",
        Ogimg: "/images/wa.png",
        Ogurl: "/contact",
    };
    res.render('contact', { title: 'About Us' })
})

//about
router.get('/about', (req, res, next) => {
    res.locals.metaTags = {
        summary: "About us",
        keywords: "About us, address, location",
        Ogimg: "/images/wa.png",
        Ogurl: "/about",
    };
    res.render('about', { title: 'About Us' })
})

//privacy
router.get('/privacy-policy', (req, res, next) => {
    res.render('privacy-policy', { title: 'Privacy Policy', message: req.flash('success') })
})


//articles
router.get('/articles/:p', async (req, res, next) => {
  try {
    const pageNombre = isNaN(req.params.p) ? 1 : parseInt(req.params.p);
    const pageSize = 9;

    const skip = (pageNombre - 1) * pageSize;

    const [posts, totalPostsCount] = await Promise.all([
      Post.find({}).sort({ date: -1 }).skip(skip).limit(pageSize).lean(),
      Post.countDocuments({}),
    ]);

    const pageCount = Math.ceil(totalPostsCount / pageSize);

    // metatags
    res.locals.metaTags = {
      summary: `Page ${pageNombre} Articles posted on The Brink News`,
      Ogimg: "/images/logo.png",
      Ogurl: `/articles/${pageNombre}`,
    };

    res.render('blog', {
      title: `Page ${pageNombre} in ${totalPostsCount} Articles | The Brink News`,
      posts,
      pagination: { page: pageNombre, pageCount },
    });
  } catch (err) {
    next(err);
  }
});


//admin
router.get('/admin', ensureAuthenticated, async (req, res, next) => {
  try {
    const pageNombre = parseInt(req.query.p, 10) || 1;
    const pageSize = 20;
    const skip = (pageNombre - 1) * pageSize;

    let sortOption = { _id: -1 };
    if (req.query.sort === 'views') {
      sortOption = { views: -1 };
    }

    const [posts, totalPostsCount, totalViewsAgg] = await Promise.all([
      Post.find({})
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .lean(),
      Post.countDocuments({}),

      Post.aggregate([
        { $group: { _id: null, total: { $sum: "$views" } } }
      ])
    ]);
    
    const totalViews = totalViewsAgg.length ? totalViewsAgg[0].total : 0;
    const pageCount = Math.ceil(totalPostsCount / pageSize);

    res.render('admin/posts', {
      title: 'Admin',
      posts,
      all: totalPostsCount,
      views: totalViews,
      pagination: { page: pageNombre, pageCount },
      message: req.flash("success"),
      error: req.flash("error")
    });

  } catch (err) {
    next(err);
  }
});


router.get("/admin/users", ensureAdmin, (req, res, next) => {
     var users = db.get("users")
        users.find({}, {}, (err, users) => {
        res.render('admin/users', {
            users: users,
            message: req.flash("success"),
            exclude: 'yes',
            error: req.flash("error")
             })
    })    
})

//backups


const collectionsToBackup = ['posts', 'users', 'categories'];

router.get('/backup',  ensureAdmin, (req, res, next) => {
  var db = req.db;
  var secretxxx = Math.random().toString(36).substring(2, 9)
  const archive = archiver('zip');

  res.attachment(`backup-brink-${secretxxx}.zip`); 

  archive.pipe(res); 

  Promise.all(collectionsToBackup.map((collection) => {
    return db.get(collection).find({}, {})
      .then((backupData) => {
        backupData.reverse();
        const jsonData = { [collection]: backupData };
        const jsonString = JSON.stringify(jsonData, null, 2);

        const now = new Date();
        const formattedDateTime = now.toISOString().replace(/:/g, '-');
        const fileName = `${collection}-${formattedDateTime}.json`;

        // Add the file to the archive
        archive.append(jsonString, { name: fileName });

      })
      .catch((err) => {
        console.error('Error backing up collection', collection, err);
        return Promise.reject(err);
      });
  }))
  .then(() => {
    archive.finalize(); 
  })
  .catch((err) => {
    console.error('Error during backups:', err);
    res.status(500).json({ error: 'Error during backups' });
  });
});


//account
router.get("/account", ensureAuthenticated, (req, res, next) => {
        res.render("account", {
            title: 'Account',
            message: req.flash("success"),
            error: req.flash("error")
         })
})

//single post
// router.get('/:permalink', async (req, res, next) => {
//      let link = '/'+req.params.permalink+'/'
//   try {
//     const article = await Post.findOne({ permalink: link })
//     const latestPosts = await Post.find({permalink: { $ne: link }}).sort({ date: -1 }).limit(3).exec();
//     const similarPosts = await Post.find({category: article.category, permalink: { $ne: link }}).sort({ date: -1 }).limit(4).exec();
//     res.render('singlepage', {
//       similar: similarPosts,
//       posts: latestPosts,
//       article: article
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// Sitemap
router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const protocol = req.protocol || 'https';
        let hostname = 'https://thebrinknews.com';
        if (!hostname) {
             hostname = `${protocol}://${req.headers.host}`;
        }
        // Remove trailing slash if present
        if (hostname.endsWith('/')) {
             hostname = hostname.slice(0, -1);
        }
        const urls = [
            { loc: `${hostname}/`, flex: '1.0' },
            { loc: `${hostname}/about`, flex: '0.8' },
            { loc: `${hostname}/miss-uganda`, flex: '0.8' },
            { loc: `${hostname}/events`, flex: '0.8' },
            { loc: `${hostname}/contact`, flex: '0.8' }
        ];

        const [categories, posts] = await Promise.all([
            Category.find().select('name').lean(),
            Post.find().select('permalink date').lean()
        ]);

        categories.forEach(c => {
            urls.push({
                loc: `${hostname}/c/${c.name}`,
                flex: '0.8'
            });
        });

        posts.forEach(p => {
            urls.push({
                loc: `${hostname}${p.permalink}`,
                lastmod: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
                flex: '0.7'
            });
        });

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        urls.forEach(u => {
            xml += '  <url>\n';
            xml += `    <loc>${u.loc}</loc>\n`;
            if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
            xml += `    <priority>${u.flex}</priority>\n`;
            xml += '  </url>\n';
        });
        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        return res.status(200).send(xml);
    } catch (err) {
        console.error("Sitemap generation error:", err);
        next(err);
    }
});

//single posts and updating views
router.get('/:permalink', async (req, res, next) => {
  let link = '/' + req.params.permalink + '/';
  try {
    // Find the article based on permalink
    const article = await Post.findOne({ permalink: link });

    // Convert article.views to a number and check if it's NaN
    if (isNaN(article.views)) {
      // If it's NaN, set it to 1
      article.views = 1;
    } else {
      // If it's a number, increment it by 1
      article.views = Number(article.views) + 1;
    }

    // Save the updated article
    await article.save();

    // Fetch the latest posts and similar posts
    const latestPosts = await Post.find({ permalink: { $ne: link } }).sort({ date: -1 }).limit(3).exec();
    const similarPosts = await Post.find({ category: article.category, permalink: { $ne: link } }).sort({ date: -1 }).limit(4).exec();

    // Render the page with the updated article and other data
    res.render('singlepage', {
      similar: similarPosts,
      posts: latestPosts,
      article: article,
    });
  } catch (err) {
    next(err);
  }
});



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/users/login')
}

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next()
    }
    res.redirect("/users/login")
}

module.exports = router