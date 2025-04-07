import {
  FeedLoader,
  deleteFeed,
  getAllSettings,
  getAllTags,
} from "./common/dataStorage.js";

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
    let feed = vnode.attrs.feed;
    let temp = new Date(item.pubDate);

    if (Number.isNaN(temp.valueOf())) {
      temp = new Date();
    }

    let pubDate = temp.toISOString()?.slice(0, 10);
    let label = item.title || item?.contentSnippet || "Unknown";
    let link = item.link ?? "";

    /*
    == Podcast ===========================================================================================================
    */
    if (
      item.enclosure !== undefined &&
      (item.enclosure.type.includes("audio") ||
        item.enclosure.type.includes("video"))
    ) {
      link = `/podcast.html?feed=${encodeURIComponent(feed.url)}&item=${encodeURIComponent(item.enclosure.url)}`;
    }

    /*
    == YouTube ===========================================================================================================
    */

    if (link.startsWith("https://www.youtube.com/watch?")) {
      let params = new URL(item.link).searchParams;
      let id = params.get("v");
      switch (settings["openYoutubeIn"]) {
        case "embed":
          link = `/youtube.html?id=${id}`;
          break;
        case "custom":
          let template = settings["youtubeCustomURL"];
          if (template.length == 0) {
            link = `/youtube.html?id=${id}`;
          } else {
            link = template.toLowerCase().replace("%id%", id);
          }
          break;
        case "youtube":
        default:
          link = item.link;
          break;
      }
    }

    return m("li", [
      m(
        "a",
        {
          href: link,
          target: settings["openPostsIn"] == "newtab" ? "_blank" : "",
          onclick: (e) => {
            if (
              settings["postViewer"] == "reader" &&
              !link.startsWith("/youtube.html?") &&
              !link.startsWith("/podcast.html?")
            ) {
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

    function stripHtml(html) {
      let el = new DOMParser().parseFromString(html, "text/html");
      return el.body.textContent;
    }

    let description = feed.data.description
      ? stripHtml(feed.data.description)
      : "";

    return m("section", [
      m(
        "nav",
        { class: "feed-item" },
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
                      `Are you sure you want to remove "${feed.title}" from your subscriptions?`,
                    )
                  ) {
                    deleteFeed(feed);
                    feeds = feeds.filter((f) => f !== feed);
                    allFeeds = allFeeds.filter((f) => f !== feed);
                    m.redraw();
                  }
                },
              },
              m("small", "remove"),
            ),
          ),
        ]),
      ),
      m(
        "div",
        { style: { "padding-bottom": "0.5rem" } },
        m("small", description),
      ),
      m(
        "div",
        { style: { display: vnode.state.smallDisplay ? "none" : "block" } },
        [
          m(
            "ul",
            items.map((i) => m(FeedItem, { item: i, feed })),
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

const Tag = {
  view: (vnode) => {
    let tag = vnode.attrs.tags;

    if (tag == currentTag) {
      if (currentTag == "All") {
        feeds = allFeeds;
      } else if (tag == "Untagged") {
        feeds = allFeeds.filter((f) => !f.tags || f.tags.length == 0);
      } else {
        feeds = allFeeds.filter((f) =>
          f?.tags
            ? f.tags
                .map((t) => t.toLowerCase())
                .includes(currentTag.toLowerCase())
            : false,
        );
      }

      return m("li", m("button", {}, tag));
    } else {
      return m(
        "li",
        m(
          "a",
          {
            href: "#",
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              currentTag = tag;
            },
          },
          tag,
        ),
      );
    }
  },
};

const TagsMenu = {
  view: (vnode) => {
    let menuTags = ["All"];

    if (allFeeds.some((f) => (f.tags ? f.tags.includes("") : false))) {
      menuTags.push("Untagged");
    }

    menuTags = [...menuTags, ...tags];

    return m(
      "nav",
      m(
        "ul",
        menuTags.map((t) => m(Tag, { tags: t })),
      ),
    );
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
      allFeeds = fs
        .sort((a, b) => {
          return a.lastBuildDate - b.lastBuildDate;
        })
        .reverse();

      if (currentTag == "All") {
        feeds = allFeeds;
      } else {
        feeds = allFeeds.filter((f) =>
          f.tags.map((t) => t.toLowerCase()).includes(currentTag.toLowerCase()),
        );
      }

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

    if (!vnode.state.loading && allFeeds.length > 0 && feeds.length == 0) {
      // empty tag, as in removed last feed. Back to All.
      currentTag = "All";
      feeds = allFeeds;
    }

    if (!vnode.state.loading && feeds.length > 0) {
      return [m(Menu), m(TagsMenu), m(FeedList)];
    }

    if (!vnode.state.loading && allFeeds.length == 0) {
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

/**
 * Some variables are worth noting.
 *
 * `allFeeds` holds an array with all the feeds.
 * `feeds` will hold a subset of `allFeeds` which includes only the feeds that include
 * the `currentTag`.
 *
 * Routines and events that change one should be careful to change the other so they're
 * kept kinda in sync.
 * */

let settings = await getAllSettings();
let tags = Array.from(await getAllTags())
  .filter((t) => t.length > 0)
  .sort();

let feeds = [];
let allFeeds = [];
let currentTag = "All";

function openInReaderView(url) {
  browser.tabs.create({ openInReaderMode: true, url: url });
}

const appRoot = document.getElementById("app");

m.route(appRoot, "/reader", {
  "/reader": Reader,
});
