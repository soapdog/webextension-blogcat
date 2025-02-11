import { getAllFeeds, saveFeed, loadFeedFromURL, FeedLoader } from "./common/dataStorage.js"


const Loading = {
    view: (vnode) => {
        return m("div", [
            m("h2", "Loading Feeds"),
            m("progress", { value: vnode.attrs.value, max: vnode.attrs.max })
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
    smallDisplay: false,
    view: vnode => {
        let feed = vnode.attrs.feed
        let items = vnode.state.showMore ? feed.data.items.slice(0, 3) : feed.data.items

        return m("section", [
            m("header", [
                m("a.link", { href: feed.data.link, target: "_blank" }, m("b", feed.data.title)),
                m("small.right", {
                    onclick: () => {
                        vnode.state.smallDisplay = !vnode.state.smallDisplay
                    }
                }, "…")
            ]),
            m("small", m("i", feed.data.description)),
            m("div", { style: { display: vnode.state.smallDisplay ? "none" : "block" } }, [
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
        await FeedLoader.initialiseQueue()
        vnode.state.progressMax = FeedLoader.total

        const finishedLoading = (fs) => {
        	feeds = fs.sort((a, b) => {
                return a.lastBuildDate - b.lastBuildDate
            }).reverse()

            vnode.state.loading = false

            m.redraw()
            console.log("callback", feeds)
        }

        FeedLoader.processQueue(finishedLoading)

    },
    view: (vnode) => {
        vnode.state.progressValue = FeedLoader.progress
        return vnode.state.loading ? m(Loading, { value: vnode.state.progressValue, max: vnode.state.progressMax }) : m(FeedList)
    }
}




const appRoot = document.getElementById("app")
let feeds = []

m.route(appRoot, "/reader", {
    "/reader": Reader
})