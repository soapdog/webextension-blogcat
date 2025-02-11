import { getAllFeeds, saveFeed, saveFeeds, loadFeedFromURL } from "./common/dataStorage.js"

const search = new URLSearchParams(location.search)


const opmlParser = {
    url: "",
    feeds: [],
    loadFromURL: u => {
        opmlParser.url = u

        fetch(u)
            .then((response) => response.text())
            .then((text) => {
                const parser = new DOMParser()
                const doc = parser.parseFromString(text, "text/xml")
                const opml = doc.documentElement

                const outlines = opml.querySelectorAll(`outline[xmlUrl]:not([xmlUrl=""])`)

                for (const outline of outlines) {
                    const feed = {
                        title: outline.getAttribute("title"),
                        url: outline.getAttribute("xmlUrl"),
                        web: outline.getAttribute("htmlUrl"),
                        selected: false,
                        subscribed: false
                    }

                    if (feed.web == "") {
                    	feed.web = undefined
                    }

                    opmlParser.feeds.push(feed)
                }
                m.redraw()
            })
    }
}

if (search.has("url")) {
    opmlParser.loadFromURL(search.get("url"))
}

// use routing for importing from URL or File


const InputForm = {
    oninit: vnode => {
        vnode.state.url = opmlParser.url
    },
    view: vnode => {
        return m("form", [
            m("label", { for: "url" }, "OPML URL"),
            m("input", {
                type: "text",
                name: "url",
                value: vnode.state.url,
                oninput: e => {
                    vnode.state.url = e.target.value
                }
            }),
            m("input", { type: "submit", value: "Fetch" })
        ])
    }
}

const FeedItem = {
    view: vnode => {
        return m("tr", [
            m("td", m("input[type=checkbox]", {
                checked: vnode.attrs.feed.selected,
                oninput: e => {
                	vnode.attrs.feed.selected = e.target.checked
                }
            })),
            m("td", vnode.attrs.feed.web ? m("a", {href: vnode.attrs.feed.web, target: "_blank"}, vnode.attrs.feed.title) : vnode.attrs.feed.title),
            m("td", m("button", {
            	disabled: vnode.attrs.feed.subscribed,
            	onclick: e =>  {
            		const feed = {
            			title: vnode.attrs.title,
            			url: vnode.attrs.feed.url,
            			frequency: "realtime"
            		}

            		saveFeed(feed).then(onOk =>{
            			vnode.attrs.feed.subscribed = true 
            			m.redraw()
            		})
            		

            }}, "add")),
        ])
    }
}

const addAllSelected = () => {
	let feeds = {}
	opmlParser.feeds.forEach(feed => {
		if (feed.selected) {
			feeds[feed.url] = {
				title: feed.title,
				url: feed.url,
				frequency: "realtime"
			}
			feed.subscribed = true
		}
	})

	console.log("saving feeds", feeds)
	saveFeeds(feeds).then( e => {
		m.redraw()
	})
}

const FeedList = {
    view: vnode => {
        return m("table", [
            m("thead", [
                m("tr", [
                    m("th", m("input", {
                        type: "checkbox",
                        oninput: e => {
                            opmlParser.feeds.forEach(f => f.selected = e.target.checked)
                            console.log(opmlParser.feeds)
                            m.redraw()
                        }
                    })),
                    m("th", "title"),
                    m("th", m("button", {onclick: addAllSelected}, "add all selected"))
                ])
            ]),
            m("tbody", opmlParser.feeds.map(feed => m(FeedItem, { feed })))
        ])
    }
}

const URLImporter = {
    view: vnode => {
        return m("section", [
            m(InputForm),
            opmlParser.feeds.length > 0 ? m(FeedList) : ""
        ])
    }
}

const appRoot = document.getElementById("app")

m.route(appRoot, "/fromUrl", {
    "/fromUrl": URLImporter
})