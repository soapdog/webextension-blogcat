import { getAllFeeds, deleteFeed } from "./common/dataStorage.js"

const FeedItem = {
    view: vnode => {
        let feed = vnode.attrs.feed
        let title = feed.title ?? feed.url 

        if (title.length == 0) {
            title = feed.url
        }

        if (feed.errorFetching) {
            title = [ m("span", title), m("small", "  •  "), m("mark", "error fetching this feed")]
        }
        return m("tr", [
            m("td", m("input[type=checkbox]", {
                checked: feed.selected,
                oninput: e => {
                	feed.selected = e.target.checked
                }
            })),
            m("td", feed.web ? m("a", {href: feed.web, target: "_blank"}, title) : title),
            m("td", m("button", {
            	disabled: feed.subscribed,
            	onclick: e =>  {
            		deleteFeed(feed)
                    fetchFeeds()
            
            }}, feed.subscribed ? "Removed" : "Remove")),
        ])
    }
}

const removeAllSelected = (e) => {
    e.preventDefault()
    e.stopPropagation()
    feeds.forEach(feed => {
        if (feed.selected) {
            deleteFeed(feed)
        }
    })
    fetchFeeds()
}

const FeedList = {
    view: vnode => {
        return m("table", [
            m("thead", [
                m("tr", [
                    m("th", m("input", {
                        type: "checkbox",
                        oninput: e => {
                            feeds.forEach(f => f.selected = e.target.checked)
                            m.redraw()
                        }
                    })),
                    m("th", "Title"),
                    m("th", m("a", {href: "#", onclick: removeAllSelected}, "Remove Selected"))
                ])
            ]),
            m("tbody", feeds.map(feed => m(FeedItem, { feed })))
        ])
    }
}

const EmptyList = {
    view: vnode => {
        return m("h1", "You haven't subscribed to any feed yet.")
    }
}

function showBrokenFeeds() {
    feeds = feeds.filter(f => f.errorFetching)
}

function exportOPML() {

}

const Menu = {
    view: vnode => {
        return m("nav", [
            m("ul", m("li", m("div.box", [
                m("img", {src: "../icons/cat_computer512c.png", class:"cat-icon"}),
                m("strong","Manage Feeds")
            ]))),
            m("ul", [
                m("li", m("a",{href: "#", onclick: exportOPML}, "Export OPML")),
                m("li", m("a",{href: "#", onclick: showBrokenFeeds}, "Show broken feeds")),
            ])
        ])
    }
}

const feedManager = {
    view: vnode => {
        return [
            m(Menu),
            m("section", [
                feeds.length == 0 ? m(EmptyList) : m(FeedList)
            ])
        ]
    }
}



let feeds = []

async function fetchFeeds() {
    let feedsObj = await getAllFeeds()

    feeds = Object.keys(feedsObj).map(k => feedsObj[k])

    console.log(feeds)
    m.redraw()
}

await fetchFeeds()

const appRoot = document.getElementById("app")

m.route(appRoot, "/feedManager", {
    "/feedManager": feedManager
})