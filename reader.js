import { FeedLoader, deleteFeed } from "./common/dataStorage.js"


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
            m("a", { href: item.link, target: "_blank" }, item.title),
            m("span", "  •  "),
            m("small", pubDate)
        ])
    }
}

const FeedDisplay = {
    showMore: true,
    view: vnode => {
        let feed = vnode.attrs.feed
        let items = vnode.state.showMore ? feed.data.items.slice(0, 3) : feed.data.items

        if (!feed.data.link.includes("://")) {
            feed.data.link = `https://${feed.data.link}`
        }

        return m("section", [
            m("nav", m("ul", [
                m("li", m("a", { href: feed.data.link, target: "_blank" }, m("b", feed.data.title))),
                m("li", m("a", { href: `/addFeed.html?url=${feed.url}`, target: "_blank" }, m("small", "edit"))),
                m("li", m("a", {
                    href: "#",
                    onclick: e => {
                        e.preventDefault()
                        e.stopPropagation()
                        vnode.state.showMore = !vnode.state.showMore
                    }
                }, vnode.state.showMore ? m("small","more posts") : m("small","fewer posts"))),
                m("li", m("a", {
                    href: "#",
                    onclick: e => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteFeed(feed)
                        location.reload()
                    }
                }, m("small", "remove")))
            ])),
            m("small", m("i", feed.data.description)),
            m("div", { style: { display: vnode.state.smallDisplay ? "none" : "block" } }, [
                m("ul", items.map(i => m(FeedItem, { item: i }))),
                
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