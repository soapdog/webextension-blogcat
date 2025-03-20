import {
  getAllFeeds,
  saveFeed,
  saveFeeds,
  loadFeedFromURL,
} from "./common/dataStorage.js";

import { opml } from "./common/opml.js";

const search = new URLSearchParams(location.search);

let feeds = [];
let url = "";

if (search.has("url")) {
  let res = await opml.loadFromURL(search.get("url"));
  feeds = res.feeds;
  url = res.url;
}

// use routing for importing from URL or File

const InputForm = {
  oninit: (vnode) => {
    vnode.state.url = url;
  },
  view: (vnode) => {
    return m("form", [
      m("label", { for: "url" }, "OPML URL"),
      m("input", {
        type: "text",
        name: "url",
        value: vnode.state.url,
        oninput: (e) => {
          vnode.state.url = e.target.value;
        },
      }),
      m("input", { type: "submit", value: "Load From URL" }),
      m("label", { for: "file" }, "OPML FILE"),
      m("input", {
        name: "file",
        type: "file",
        onchange: (e) => {
          const c = (fs) => {
            feeds = fs;
            m.redraw();
          };
          opml.loadFromFile(e, c);
        },
      }),
    ]);
  },
};

const FeedItem = {
  view: (vnode) => {
    return m("tr", [
      m(
        "td",
        m("input[type=checkbox]", {
          checked: vnode.attrs.feed.selected,
          oninput: (e) => {
            vnode.attrs.feed.selected = e.target.checked;
          },
        }),
      ),
      m(
        "td",
        vnode.attrs.feed.web
          ? m(
              "a",
              { href: vnode.attrs.feed.web, target: "_blank" },
              vnode.attrs.feed.title,
            )
          : vnode.attrs.feed.title,
      ),
      m("td", vnode.attrs.feed.tags.join(" ")),
      m(
        "td",
        m(
          "button",
          {
            disabled: vnode.attrs.feed.subscribed,
            onclick: (e) => {
              const feed = {
                title: vnode.attrs.title,
                url: vnode.attrs.feed.url,
                frequency: "daily",
                tags: vnode.attrs.feed.tags,
              };

              saveFeed(feed).then((onOk) => {
                vnode.attrs.feed.subscribed = true;
                m.redraw();
              });
            },
          },
          vnode.attrs.feed.subscribed ? "Subscribed" : "Subscribe",
        ),
      ),
    ]);
  },
};

const addAllSelected = (evt) => {
  evt.preventDefault();
  evt.stopPropagation();
  let fs = [];
  feeds.forEach((feed) => {
    if (feed.selected) {
      fs.push({
        title: feed.title,
        url: feed.url,
        frequency: "daily",
        tags: feed.tags,
      });
      feed.subscribed = true;
    }
  });

  let ps = saveFeeds(fs);

  Promise.all(ps, (e) => {
    m.redraw();
  });
};

const FeedList = {
  view: (vnode) => {
    return m("table", [
      m("thead", [
        m("tr", [
          m(
            "th",
            m("input", {
              type: "checkbox",
              oninput: (e) => {
                feeds.forEach((f) => (f.selected = e.target.checked));
                console.log(feeds);
                m.redraw();
              },
            }),
          ),
          m("th", "Title"),
          m("th", "Tag"),
          m(
            "th",
            m("button", { onclick: addAllSelected }, "Subscribe Selected"),
          ),
        ]),
      ]),
      m(
        "tbody",
        feeds.map((feed) => m(FeedItem, { feed })),
      ),
    ]);
  },
};

const URLImporter = {
  view: (vnode) => {
    return m("section", [
      m(InputForm),
      m("p", [
        "Open the documentation about ",
        m(
          "a",
          { href: "/docs/index.html#/opml", target: "_blank" },
          "importing and exporting OPML files",
        ),
        ".",
      ]),
      feeds.length > 0 ? m(FeedList) : "",
    ]);
  },
};

const appRoot = document.getElementById("app");

m.route(appRoot, "/fromUrl", {
  "/fromUrl": URLImporter,
});
