let feeds = {}

export async function saveFeed(feed) {
    let obj = await browser.storage.local.get({ "feeds": {} })
    feeds = obj.feeds
    delete feed.data
    feeds[feed.url] = feed

    return browser.storage.local.set({ feeds })
}

export async function saveFeeds(newFeeds) {
    let obj = await browser.storage.local.get({ "feeds": {} })
    feeds = obj.feeds

    for (const feed in newFeeds) {
        delete newFeeds[feed].data
        feeds[feed] = newFeeds[feed]
    }

    return browser.storage.local.set({ feeds })
}

export async function getAllFeeds() {
    return await browser.storage.local.get({ "feeds": {} })
}

export async function loadFeedFromURL(url) {
    let parser = new RSSParser({
        timeout: 1000,
    })
    let feed = await parser.parseURL(url)
    return feed
}

export const FeedLoader = {
    queue: [],
    feeds: [],
    total: 0,
    progress: 0,
    initialiseQueue: async () => {
        let obj = await getAllFeeds()
        let keys = Object.keys(obj.feeds)
        FeedLoader.total = keys.length
        FeedLoader.progress = 0
        FeedLoader.queue = keys.map(k => obj.feeds[k])
    },
    loadOne: async () => {
        if (FeedLoader.queue.length == 0) {
            console.timeEnd("loadOne")
            return false
        }

        let feed = FeedLoader.queue.shift()
        console.time(feed.url)

        let data = await loadFeedFromURL(feed.url)
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

        console.log(`${FeedLoader.progress}/${FeedLoader.total}`)
        FeedLoader.feeds.push(structuredClone(feed))

        await saveFeed(feed)

        console.timeEnd(feed.url)

        return true
    },
    processQueue: (callback) => {
        const nextLoop = () => {
            FeedLoader.progress += 1
            FeedLoader.processQueue(callback)
            m.redraw()
        }

        if (FeedLoader.queue.length > 0) {
            FeedLoader.loadOne().then(nextLoop, nextLoop)
        } else {
            callback(FeedLoader.feeds)
        }
    }


}