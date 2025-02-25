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

const defaultSettings = {
    postsPerBlog: 3,
    openPostsIn: "newtab",
    postViewer: "reader",
    maxFetchErrors: 3,
    openEditorIn: "sidebar"
}

const reservedKeys = [
    "settings",
    "account@"
]

function removeReservedKeys(obj) {
    reservedKeys.forEach(k => delete obj[k])
}

export async function saveFeed(feed) {
    let obj = {}

    if (!feed.url.includes("://")) {
        feed.url = `https://${feed.url}`
    }

    let key = `feed@${feed.url}`

    obj[key] = feed
    return browser.storage.local.set(obj)
}

export async function deleteFeed(feed) {
    console.log("removing feed", feed.url)
    return browser.storage.local.remove(`feed@${feed.url}`)
}

export async function deletePostingAccount(account) {
    console.log("removing account", account.name)
    return browser.storage.local.remove(`account@${account.name}`)
}


export async function saveFeeds(newFeeds) {

    const ps = newFeeds.map(f => saveFeed(f))

    return ps
}

export async function getAllFeeds() {
    let all =  await browser.storage.local.get(undefined) // this is a stupid hack, cue https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
    let keys = Object.keys(all)
    keys.forEach(k => {
        if (!k.startsWith("feed@")) {
            delete all[k]
        }
    })
    return all
}

export async function getAllSettings() {
    let obj = await browser.storage.local.get("settings")

    if (!Object.hasOwn(obj, "settings")) {
        return defaultSettings
    } else {
        return obj.settings
    }
}

export async function getAllPostingAccounts() {
    let all =  await browser.storage.local.get(undefined) // this is a stupid hack, cue https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get
    let keys = Object.keys(all)
    keys.forEach(k => {
        if (!k.startsWith("account@")) {
            delete all[k]
        }
    })
    return all
}

export async function savePostingAccount(account) {
    let obj = {}

    let key = `account@${account.name}`

    obj[key] = account
    return browser.storage.local.set(obj)
}

export async function valueForSetting(key) {
    let settings = await getAllSettings()

    if (Object.hasOwn(settings, key)) {
        return settings[key]
    } else {
        return defaultSettings[key]
    }
}

export async function saveSettings(settings) {
    return browser.storage.local.set({settings})
}

export async function loadFeedFromURL(url) {
    let parser = new RSSParser({
        timeout: 6000,
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
    let maxFetchErrors = await valueForSetting("maxFetchErrors")


    try {
        if (Number.isInteger(feed.errorCount) && 
            feed.errorFetching && 
            feed.errorCount >= maxFetchErrorsqq) {
            console.log("too many errors, not fetching", feed.url)
        } else if (feed.frequency == "realtime" || m_today !== m_lastFetch) {
            data = await loadFeedFromURL(feed.url)
            feed.lastFetch = today
            feed.errorFetching = false 
            feed.errorCount = 0
        } else if (feed.frequency == "daily" && w_today !== w_lastFetch) {
            if (d_today !== d_lastFetch) {
                data = await loadFeedFromURL(feed.url)
                feed.errorFetching = false
                feed.lastFetch = today
                feed.errorCount = 0
            } else {
                console.log("already fetch daily", feed.url)
                data = feed.data
            }
        } else if (feed.frequency == "weekly") {

            if (w_today !== w_lastFetch) {
                data = await loadFeedFromURL(feed.url)
                feed.errorFetching = false
                feed.lastFetch = today
                feed.errorCount = 0
            } else {
                console.log("already fetch weekly", feed.url)
                data = feed.data
            }
        } else if (feed.frequency == "monthly") {
            if (m_today !== m_lastFetch) {
                data = await loadFeedFromURL(feed.url)
                feed.errorFetching = false
                feed.lastFetch = today
                feed.errorCount = 0
            } else {
                console.log("already fetch monthly", feed.url)
                data = feed.data
            }
        } else {
            data = feed.data
        }
    }catch(e){
        console.error(`thrown from feed`, feed.url)
    }

    if (!data || !data.items) {
        feed.errorFetching = true
        if (!Number.isInteger(feed.errorCount)) {
            feed.errorCount = 1
        } else {
            feed.errorCount += 1
        } 
        ticker()
        saveFeed(feed)
        return false
    }

    feed.data = data

    if (feed.data.items[0].hasOwnProperty("isoDate")) {
        feed.lastBuildDate = new Date(feed.data.items[0].isoDate)
    } else if (feed.data.items[0].hasOwnProperty("pubDate")) {
        feed.lastBuildDate = new Date(feed.data.items[0].pubDate)
    } else {
        feed.lastBuildDate = today
    }

    if (!feed.data.link.includes("://")) {
        feed.data.link = `https://${feed.data.link}`
    }

    let items = feed.data.items

    feed.data.items = items.map(i => {
        if (!i.link.includes("://")) {
            if (!i.link.startsWith("/")) {
                i.link = `/${i.link}`
            }
            i.link = new URL(i.link, feed.data.link)
        }
        return i
    })

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
            let p = loadFeed(f, ticker)
            
            return p
        })

        const done = (feeds) => {
            let fs = feeds.filter((f) => {
                if (f.status == "fulfilled" && f.value.hasOwnProperty("data")) {
                    return true
                } else {
                    return false
                }
            })
            .map(f => f.value)

            callback(fs)
        }

        Promise.allSettled(ps).then(done).catch(done)


    }
}