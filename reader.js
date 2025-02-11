import { getAllFeeds, saveFeed, loadFeedFromURL } from "./common/dataStorage.js"


const Loading = {
    view: (vnode) => {
        return m("div", [
            m("h2", "Loading Feeds"),
            m("progress", {value: vnode.attrs.value, max: vnode.attrs.max})
        ])
    }
}

const FeedItem = {
    view: vnode => {
        let item = vnode.attrs.item
        let pubDate = new Date(item.pubDate).toISOString().slice(0, 10)

        return m("li", [
            m("a.feed-item", { href: item.link, target: "_blank" }, item.title),
            m("small.right", pubDate)
        ])
    }
}

const FeedDisplay = {
    showMore: true,
    smallDisplay: true,
    view: vnode => {
        let feed = vnode.attrs.feed
        let items = vnode.state.showMore ? feed.data.items.slice(0, 3) : feed.data.items

        return m("section", [
            m("header", [
                m("a.link", {href: feed.data.link, target: "_blank"}, m("b", feed.data.title)),
                m("small.right", {onclick: () => {
                	vnode.state.smallDisplay = !vnode.state.smallDisplay
                }}, "…")
            ]),
            m("small", m("i", feed.data.description)),
            m("div", {style: {display: vnode.state.smallDisplay ? "none" : "block"}}, [
	            m("ul", { class: "item-list-expanded" }, items.map(i => m(FeedItem, { item: i }))),
	            m("small", {
	                onclick: e => {
	                    vnode.state.showMore = !vnode.state.showMore
	                }
	            }, vnode.state.showMore ? "show more posts" : "show fewer posts")
	        ])
	    ])


    }
}

const FeedList = {
    view: vnode => {
        return feeds.map(f => m(FeedDisplay, { feed: f }))

    }
}

const Reader = {
    loading: true,
    progressValue: 0,
    progressMax: 0,
    oninit: async (vnode) => {
        let obj = await getAllFeeds()
        vnode.state.progressMax = Object.keys(obj.feeds).length
        for (const f in obj.feeds) {
        	vnode.state.progressValue += 1
            try {
                let feed = obj.feeds[f]
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


                saveFeed(feed)

                console.log("pushing", feed)
                feeds.push(feed)
                m.redraw()

            } catch (e) {
                console.log(e)
            }
        }


        feeds = feeds.sort((a, b) => {
            return a.lastBuildDate - b.lastBuildDate
        }).reverse()
        vnode.state.loading = false
        console.log(obj.feeds)
        console.log(feeds)
        m.redraw()
    },
    view: (vnode) => {
        return vnode.state.loading ? m(Loading, {value: vnode.state.progressValue, max: vnode.state.progressMax}) : m(FeedList)
    }
}




const appRoot = document.getElementById("app")
let feeds = []

m.route(appRoot, "/reader", {
    "/reader": Reader
})