// This script is released to the public domain and may be used, modified and
// distributed without restrictions. Attribution not necessary but appreciated.
// Source: https://weeknumber.com/how-to/javascript

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
        3 + (week1.getDay() + 6) % 7) / 7);
}

export async function saveFeed(feed) {
    let obj = {}
    obj[feed.url] = feed
    return browser.storage.local.set(obj)
}

export async function saveFeeds(newFeeds) {

    const ps = newFeeds.map(f => saveFeed(f))

    return ps
}

export async function getAllFeeds() {
    return await browser.storage.local.get(undefined) // this is a stupid hack, cue https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
}

export async function loadFeedFromURL(url) {
    let parser = new RSSParser({
        timeout: 3000,
    })
    let feed = await parser.parseURL(url)

    return feed
}

export async function loadFeed(feed, ticker) {
    let data
    let lastFetchDate = new Date(feed.lastFetch) || new Date(70, 1, 1)
    let today = new Date()
    let ellapsedTime = today - lastFetchDate
    let d_today = today.getDay()
    let d_lastFetch = lastFetchDate.getDay()
    let w_today = today.getWeek()
    let w_lastFetch = lastFetchDate.getWeek()
    let m_today = today.getMonth()
    let m_lastFetch = lastFetchDate.getMonth()

    if (feed.frequency == "realtime" || m_today !== m_lastFetch) {
        data = await loadFeedFromURL(feed.url)
    } else if (feed.frequency == "daily" && w_today !== w_lastFetch) {
        if (d_today !== d_lastFetch) {
            data = await loadFeedFromURL(feed.url)
        } else {
            console.log("already fetch daily", feed.url)
            data = feed.data
        }
    } else if (feed.frequency == "weekly") {

        if (w_today !== w_lastFetch) {
            data = await loadFeedFromURL(feed.url)
        } else {
            console.log("already fetch weekly", feed.url)
            data = feed.data
        }
    } else if (feed.frequency == "monthly") {
        if (m_today !== m_lastFetch) {
            data = await loadFeedFromURL(feed.url)
        } else {
            console.log("already fetch monthly", feed.url)
            data = feed.data
        }
    } else {
        data = feed.data
    }



    if (!data || !data.items) {
        console.error(`something strange with the feed`, data)
        ticker()
        return false
    }

    feed.data = data
    feed.lastFetch = today

    if (feed.data.items[0].hasOwnProperty("isoDate")) {
        feed.lastBuildDate = new Date(feed.data.items[0].isoDate)
    } else if (feed.data.items[0].hasOwnProperty("pubDate")) {
        feed.lastBuildDate = new Date(feed.data.items[0].pubDate)
    } else {
        feed.lastBuildDate = today
    }

    ticker()

    saveFeed(feed)

    return feed
}

export const FeedLoader = {
    queue: [],
    feeds: [],
    total: 0,
    progress: 0,
    initialiseQueue: async () => {
        let obj = await getAllFeeds()
        let keys = Object.keys(obj)
        FeedLoader.total = keys.length
        FeedLoader.progress = 0
        FeedLoader.queue = keys.map(k => obj[k])
    },
    processQueue: (callback) => {
        const ticker = () => {
            // console.log(`${FeedLoader.progress}/${FeedLoader.total}`)
            FeedLoader.progress += 1
            m.redraw()
        }

        let ps = FeedLoader.queue.map(f => {
            let p
            try {
                p = loadFeed(f, ticker)
            } catch (e) {
                console.log(`thrown from feedloader`, e)
                ticker()
                return false
            }
            return p
        })

        const done = (feeds) => {
            let fs = feeds.filter((f) => {
                if (f.status == "fulfilled") {
                    return true
                } else {
                    return false
                }
            }).map(f => f.value)
            callback(fs)
        }

        Promise.allSettled(ps).then(done).catch(done)


    }
}