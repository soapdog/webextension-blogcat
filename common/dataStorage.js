let feeds = {}

export async function saveFeed(feed) {
    let obj = await browser.storage.local.get({"feeds": {}})
    feeds = obj.feeds
    feeds[feed.url] = feed

    return browser.storage.local.set({feeds})
}

export async function getAllFeeds() {
    return await browser.storage.local.get({"feeds": {}})
}

export async function loadFeedFromURL(url) {
    let parser = new RSSParser();
    let feed = await parser.parseURL(url)

    console.log(feed);
       
    return feed
}