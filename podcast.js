import { getFeedWithURL, getAllSettings } from "./common/dataStorage.js";

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
            m("h3", { style: { display: "inline" } }, "BlogCat Podcast Viewer"),
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
            { href: "/docs/index.html#/podcast", target: "_blank" },
            "Help",
          ),
        ),
      ]),
    ]);
  },
};

const PodcastMeta = {
  view: (vnode) => {
    let meta = feed.data;
    return [
      m("h1", feed.title),
      m("section.podcast-meta", [
        m(
          "a",
          { href: meta.image.link, target: "_blank" },
          m("img.podcast-banner", { src: meta.image.url }),
        ),
        m("div.description", meta.description),
      ]),
    ];
  },
};

const ItemMeta = {
  view: (vnode) => {
    let meta = feed.data;
    let poster = item?.itunes?.image || meta.image.url;
    let episodeLabel =
      item?.itunes?.season && item?.itunes?.episode
        ? `Season ${item?.itunes?.season} — Episode ${item?.itunes?.episode}`
        : "Episode";
    return [
      m("h2", episodeLabel),
      m("section.episode-meta", [
        m(
          "div",
          { style: { display: "flex", "flex-direction": "column" } },
          m("video", {
            src: item.enclosure.url,
            controls: true,
            poster,
          }),
          item?.itunes?.author
            ? m("span", `Author: ${item.itunes.author}`)
            : "",
        ),
        m("div.description", m.trust(item.content)),
      ]),
    ];
  },
};

const PodcastViewer = {
  view: (vnode) => {
    return [m(Menu), m(PodcastMeta), m(ItemMeta)];
  },
};

/*
== Initialise ===========================================================================================================
*/

let feed;
let item;

const search = new URLSearchParams(location.search);

if (search.has("feed")) {
  let url = search.get("feed");
  feed = await getFeedWithURL(url);
}

if (search.has("item")) {
  let link = search.get("item");

  item = feed.data.items.find((i) => i.enclosure.url == link);
}

// console.log(feed);
// console.log(item);

let seasons = {};

feed.data.items.forEach((i) => {
  if (i?.itunes?.season && i?.itunes?.episode) {
    if (!seasons[i.itunes.season]) {
      seasons[i.itunes.season] = {};
    }
    seasons[i.itunes.season][i.itunes.episode] = i;
  }
  // console.dir(i);
});

console.dir(seasons);

let settings = await getAllSettings();

const appRoot = document.getElementById("app");

m.route(appRoot, "/podcast", {
  "/podcast": PodcastViewer,
});
