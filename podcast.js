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
            { href: "/docs/index.html#/podcast", target: "_blank" },
            "Help",
          ),
        ),
      ]),
    ]);
  },
};

const SeasonSelector = {
  view: (vnode) => {
    return m(
      "select",
      Object.keys(seasons).map((s) => {
        return m(
          "option",
          {
            value: s,
            selected: s == selectedSeason,
            onclick: (e) => {
              selectedSeason = e.target.value;
            },
          },
          `Season ${s}`,
        );
      }),
    );
  },
};

const EpisodeSelector = {
  view: (vnode) => {
    return m(
      "select",
      Object.keys(seasons[selectedSeason]).map((e) => {
        let episode = seasons[selectedSeason][e];
        return m(
          "option",
          {
            value: e,
            selected: e == selectedEpisode,
            onclick: (e) => {
              selectedEpisode = e.target.value;
              item = seasons[selectedSeason][selectedEpisode];
            },
          },
          `${episode.title}`,
        );
      }),
    );
  },
};

const PodcastMeta = {
  view: (vnode) => {
    let meta = feed.data;
    return [
      m(
        "nav",
        m("ul", [
          m("li", m("h1", feed.title)),
          m("li", m(SeasonSelector)),
          m("li", m(EpisodeSelector)),
        ]),
      ),
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
            preload: "auto",
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
});

let selectedSeason = item?.itunes?.season;
let selectedEpisode = item?.itunes?.episode;

let settings = await getAllSettings();

const appRoot = document.getElementById("app");

m.route(appRoot, "/podcast", {
  "/podcast": PodcastViewer,
});
