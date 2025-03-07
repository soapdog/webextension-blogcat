import { FeedLoader, deleteFeed, getAllSettings } from "/common/dataStorage.js";

const Loading = {
  view: (vnode) => {
    return m("div", [
      m("h2", "Loading Feeds"),
      m("progress", { value: vnode.attrs.value, max: vnode.attrs.max }),
    ]);
  },
};

const FeedItem = {
  view: (vnode) => {
    let item = vnode.attrs.item;
    let pubDate = new Date(item.pubDate).toISOString().slice(0, 10);
    console.log(item);
    let label = item.title || item?.contentSnippet || "Unknown";
    return m("li", [
      m(
        "a",
        {
          href: item.link,
          target: settings["openPostsIn"] == "newtab" ? "_blank" : "",
          onclick: (e) => {
            console.log("settings", settings);
            console.log(settings["postViewer"]);
            if (settings["postViewer"] == "reader") {
              e.preventDefault();
              e.stopPropagation();
              openInReaderView(item.link);
            }
          },
        },
        label,
      ),
      m("span", "  •  "),
      m("small", pubDate),
    ]);
  },
};

const FeedDisplay = {
  showMore: true,
  view: (vnode) => {
    let feed = vnode.attrs.feed;
    let items = vnode.state.showMore
      ? feed.data.items.slice(0, 3)
      : feed.data.items;

    return m("section", [
      m(
        "nav",
        m("ul", [
          m(
            "li",
            m(
              "a",
              { href: feed.data.link, target: "_blank" },
              m("b", feed.data.title),
            ),
          ),
          m(
            "li",
            m(
              "a",
              { href: `/addFeed.html?url=${feed.url}`, target: "_blank" },
              m("small", "edit"),
            ),
          ),
          m(
            "li",
            m(
              "a",
              {
                href: "#",
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  vnode.state.showMore = !vnode.state.showMore;
                },
              },
              vnode.state.showMore
                ? m("small", "more posts")
                : m("small", "fewer posts"),
            ),
          ),
          m(
            "li",
            m(
              "a",
              {
                href: "#",
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (
                    window.confirm(
                      `Are you sure you want to remove "${feed.title}" from your subscriptions? Confirming it will reload the reader.`,
                    )
                  ) {
                    deleteFeed(feed);
                    location.reload();
                  }
                },
              },
              m("small", "remove"),
            ),
          ),
        ]),
      ),
      m("small", m("i", feed.data.description)),
      m(
        "div",
        { style: { display: vnode.state.smallDisplay ? "none" : "block" } },
        [
          m(
            "ul",
            items.map((i) => m(FeedItem, { item: i })),
          ),
        ],
      ),
    ]);
  },
};

const FeedList = {
  view: (vnode) => {
    return feeds.map((f) => m(FeedDisplay, { feed: f }));
  },
};

const Menu = {
  view: (vnode) => {
    return m("nav", [
      m(
        "ul",
        m(
          "li",
          m("div.box", [
            m("img", {
              src: "../icons/cat_reading512c.png",
              class: "cat-icon",
            }),
            m("h2", { style: { display: "inline" } }, "BlogCat"),
          ]),
        ),
      ),
      m("ul", [
        m(
          "li",
          m(
            "a",
            { href: "/feedManagement.html", onclick: () => {} },
            "Manage Feeds",
          ),
        ),
        m(
          "li",
          m(
            "a",
            { href: "/docs/index.html#/reader", target: "_blank" },
            "Help",
          ),
        ),
      ]),
    ]);
  },
};

const Reader = {
  loading: true,
  progressValue: 0,
  progressMax: 0,
  oninit: async (vnode) => {
    await FeedLoader.initialiseQueue();
    vnode.state.progressMax = FeedLoader.total;

    const finishedLoading = (fs) => {
      feeds = fs
        .sort((a, b) => {
          return a.lastBuildDate - b.lastBuildDate;
        })
        .reverse();

      vnode.state.loading = false;

      m.redraw();
    };

    FeedLoader.processQueue(finishedLoading);
  },
  view: (vnode) => {
    vnode.state.progressValue = FeedLoader.progress;

    if (vnode.state.loading) {
      return m(Loading, {
        value: vnode.state.progressValue,
        max: vnode.state.progressMax,
      });
    }

    if (!vnode.state.loading && feeds.length > 0) {
      return [m(Menu), m(FeedList)];
    }

    if (!vnode.state.loading && feeds.length == 0) {
      let chunk = `
      You have not yet subscribed to any website. You can:
      <ul>
        <li><a href="/docs/index.html#/quickstart">Check out the Getting Started guide.</a></li>
        <li><a href="/docs/index.html#/feeddiscovery">Learn more about feed discovery.</a></li>
        <li><a href="/docs/index.html#/opml">Learn how to import an OPML from another reader.</a></li>
      </ul>
      `;
      return [m(Menu), m("p", m.trust(chunk))];
    }
  },
};

let settings = await getAllSettings();
let feeds = [];

function openInReaderView(url) {
  browser.tabs.create({ openInReaderMode: true, url: url });
}

const appRoot = document.getElementById("app");

m.route(appRoot, "/reader", {
  "/reader": Reader,
});
