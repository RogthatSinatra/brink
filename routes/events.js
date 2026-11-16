const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const router = express.Router();
const Event = require('../models/event');

const MOOKH_EVENTS_API =
  'https://api.mookh.com/stores/event/public/?fields=id,start_date,end_date,event_name,event_poster,is_live,has_streams,store_name,event_venue,category_name,slug,country&country=UG&start_date_min=&start_date_max=&category_name=&sort_by=';

const MTN_EVENTS_API =
  'https://api.momoticketing.com/stores/event/public/?fields=id,start_date,end_date,event_name,event_poster,store_name,event_venue,category_name,slug,is_live,has_streams,country&country=UG';

function normalizeToArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.events)) return raw.events;
  const arr = Object.values(raw).find(Array.isArray);
  return Array.isArray(arr) ? arr : [];
}

async function fetchEventsFromApi(url, sourceName) {
  try {
    const resp = await axios.get(url, { timeout: 15000 });
    const arr = normalizeToArray(resp.data);
    return arr.map((e) => ({ ...e, __source: sourceName }));
  } catch (err) {
    console.warn(`Failed to fetch from ${sourceName}:`, err.message);
    return [];
  }
}

async function syncEvents() {
  try {
    console.log(`[CRON] Starting event sync at ${new Date().toISOString()}`);

    const [mookhEvents, mtnEvents] = await Promise.all([
      fetchEventsFromApi(MOOKH_EVENTS_API, 'Mookh'),
      fetchEventsFromApi(MTN_EVENTS_API, 'MTN'),
    ]);

    const allRemoteEvents = [...mookhEvents, ...mtnEvents];

    if (allRemoteEvents.length > 0) {
      for (const e of allRemoteEvents) {
        if (!e.id) continue;

        await Event.updateOne(
          { id: String(e.id) },
          {
            $set: {
              event_name: e.event_name || '',
              event_venue: e.event_venue || '',
              category_name: e.category_name || '',
              event_poster: e.event_poster || '',
              is_live: Boolean(e.is_live),
              has_streams: Boolean(e.has_streams),
              store_name: e.store_name || '',
              country: (e.country || '').toString().slice(0, 3),
              start_date: e.start_date ? new Date(e.start_date) : null,
              end_date: e.end_date ? new Date(e.end_date) : null,
              slug: e.slug ? String(e.slug).toLowerCase().trim() : undefined,
              source: e.__source,
            },
          },
          { upsert: true }
        );
      }
    }

    console.log(
      `[CRON] Sync complete. Inserted/updated: ${allRemoteEvents.length}`
    );
  } catch (err) {
    console.error('[CRON] Sync error:', err);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', syncEvents, {
  timezone: 'Africa/Kampala', // optional, adjust if needed
});

//test 16 30
// cron.schedule('30 16 * * *', syncEvents, {
//   timezone: 'Africa/Kampala',
// });

// GET /events → render events from DB
// router.get('/', async (req, res) => {
//   try {
    
//     const events = await Event.find().sort({ start_date: 1 }).lean();
//     res.render('events', { events, title: "Events" });
//   } catch (err) {
//     console.error('Error fetching events from DB:', err);
//     res.render('events', { events: [], error: 'Failed to load events.' });
//   }
// });



//delete event
// DELETE event
router.get('/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    await Event.findByIdAndDelete(id);

    res.redirect('/events');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting event');
  }
});

//edit events
//post recommend event

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/users/login");
}

module.exports = router;
