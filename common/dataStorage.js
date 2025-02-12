export async function saveFeed(feed) {
    delete feed.data
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
    let data = await loadFeedFromURL(feed.url)

    if (!data || !data.items) {
        console.error(`something strange with the feed`, data)
        ticker()
        return false
    }

    let today = new Date()

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
            console.log(`${FeedLoader.progress}/${FeedLoader.total}`)
            FeedLoader.progress += 1
            m.redraw()
        }

        let ps = FeedLoader.queue.map(f => {
            let p
            try {
                p = loadFeed(f, ticker)
            }catch(e){
                console.log(`thrown from feedloader`,e)
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