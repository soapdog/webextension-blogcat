import { getAllSettings, getFeedWithURL } from "./common/dataStorage.js";

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
            {
              href: `#`,
              onclick: (e) => {
                reverseEpisodeList = !reverseEpisodeList;
              },
            },
            "Reverse Episode List",
          ),
        ),
        m(
          "li",
          m(
            "a",
            { href: `/addFeed.html?url=${feed.url}`, target: "_blank" },
            "Edit feed",
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

// const SeasonSelector = {
//   view: (vnode) => {
//     return m(
//       "select",
//       Object.keys(seasons).map((s) => {
//         return m(
//           "option",
//           {
//             value: s,
//             selected: s == selectedSeason,
//             onclick: (e) => {
//               selectedSeason = e.target.value;
//             },
//           },
//           `Season ${s}`,
//         );
//       }),
//     );
//   },
// };

const SeasonPills = {
  view: (vnode) => {
    if (Object.keys(seasons).length == 1) {
      return m("h2", "Episodes");
    } else {
      return m("div.seasons", [
        m("h2", "Seasons"),
        m("div.season-pills", [
          Object.keys(seasons).map((s) => {
            return m(
              "button",
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
        ]),
      ]);
    }
  },
};

// const EpisodeSelector = {
//   view: (vnode) => {
//     return m(
//       "select",
//       Object.keys(seasons[selectedSeason]).map((e) => {
//         let episode = seasons[selectedSeason][e];
//         return m(
//           "option",
//           {
//             value: e,
//             selected: e == selectedEpisode,
//             onclick: (e) => {
//               selectedEpisode = e.target.value;
//               item = seasons[selectedSeason][selectedEpisode];
//             },
//           },
//           `${episode.title}`,
//         );
//       }),
//     );
//   },
// };

const EpisodePills = {
  oncreate: (vnode) => {
    let el = document.querySelector("figure.episode[selected]");
    if (el) {
      el.scrollIntoView();
    }
  },
  view: (vnode) => {
    let meta = feed.data;
    let episodes = Object.keys(seasons[selectedSeason]);
    if (reverseEpisodeList) {
      episodes.reverse();
    }
    return m(
      "div.episode-pills",
      episodes.map((e) => {
        let episode = seasons[selectedSeason][e];
        let poster = episode?.itunes?.image || meta.image.url;
        return m(
          "figure.episode",
          {
            selected: e == selectedEpisode,
            onclick: (evt) => {
              selectedEpisode = e;
              item = episode;
            },
          },
          [
            m("img", { src: poster }),
            m("figcaption", `${episode.title}`),
          ],
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
          // m("li", m(SeasonSelector)),
          // m("li", m(EpisodeSelector)),
        ]),
      ),
      m("section.podcast-meta", [
        m(
          "a",
          { href: meta.image.link, target: "_blank" },
          m("img.podcast-banner", { src: meta.image.url }),
        ),
        m("div.description", m.trust(meta.description)),
      ]),
      m(SeasonPills),
      m(EpisodePills),
    ];
  },
};

const ItemMeta = {
  oninit: (vnode) => {
    vnode.state.playNext = false;
  },
  oncreate: (vnode) => {
    console.log("attaching event");
    let el = document.getElementById("podcast-player");
    console.log(el);
    el.addEventListener("ended", (p) => {
      console.log("autoplay", vnode.state.playNext);

      if (vnode.state.playNext) {
        let keys = Object.keys(seasons[selectedSeason]);
        let s = selectedSeason;
        let e = selectedEpisode;
        console.log("current season", selectedSeason);
        let currentEpisodeIndex = keys.findIndex((ep) =>
          ep === selectedEpisode
        );
        let currentSeasonIndex = Object.keys(seasons).findIndex((ss) =>
          ss === selectedSeason
        );
        console.log("current episode", currentEpisodeIndex);
        if (keys.length === currentEpisodeIndex + 1) {
          console.log("next season");
          s = Object.keys(seasons)[currentSeasonIndex + 1];
          e = Object.keys(seasons[selectedSeason])[0];
        } else if (keys[currentEpisodeIndex + 1]) {
          e = keys[currentEpisodeIndex + 1];
        }
        console.log("new season", s);
        console.log("new episode", e);
        item = seasons[s][e];
        selectedSeason = s; //item?.itunes?.season ?? "1";
        selectedEpisode = e; //item?.itunes?.episode;
        m.redraw();
        setTimeout(() => el.play(), 1000);
      }
    });
  },
  view: (vnode) => {
    let meta = feed.data;
    let poster = item?.itunes?.image || meta.image.url;
    let episodeLabel = item?.itunes?.season && item?.itunes?.episode
      ? `Season ${item?.itunes?.season} — ${item?.title}`
      : item?.title;
    return [
      m("h2", episodeLabel),
      m("section.episode-meta", [
        m(
          "div",
          { style: { display: "flex", "flex-direction": "column" } },
          m("video", {
            src: item.enclosure.url,
            id: "podcast-player",
            controls: true,
            poster,
            preload: "auto",
          }),
          item?.itunes?.author
            ? m("span", `Author: ${item.itunes.author}`)
            : "",
          m("label", [
            m("input", {
              role: "switch",
              type: "checkbox",
              onchange: (e) => vnode.state.playNext = e.target.value,
            }),
            "Autoplay next episode",
          ]),
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
let error = {};

const handleUncaughtException = (message, source, lineno, colno, error) => {
  console.log("error happened!", message);

  error = {
    message,
    source,
    lineno,
    colno,
    error,
  };

  window.location = `/error.html?url=${feed.url}&error=${
    JSON.stringify(error)
  }`;
  return true;
};

window.onerror = handleUncaughtException;

const search = new URLSearchParams(location.search);

if (search.has("feed")) {
  let url = search.get("feed");
  feed = await getFeedWithURL(url);
}

if (search.has("item")) {
  let link = search.get("item");
  console.log("looking for episode", link);

  item = feed.data.items.find(
    (i) => decodeURIComponent(i.enclosure.url) == link,
  );
}

console.log(item);

let seasons = {};

feed.data.items.forEach((i) => {
  if (i?.itunes?.season && i?.itunes?.episode) {
    if (!seasons[i.itunes.season]) {
      seasons[i.itunes.season] = {};
    }
    seasons[i.itunes.season][i.itunes.episode] = i;
  } else if (i?.itunes?.episode) {
    if (!seasons["1"]) {
      seasons["1"] = {};
    }
    seasons["1"][i.itunes.episode] = i;
  } else {
    if (!seasons["1"]) {
      seasons["1"] = {};
    }
    seasons["1"][i.enclosure.url] = i;
  }
});

console.log(seasons);

let selectedSeason = item?.itunes?.season ?? "1";
let selectedEpisode = item?.itunes?.episode;
let reverseEpisodeList = false;

// console.dir(feed);
// console.dir(seasons);

let settings = await getAllSettings();

const appRoot = document.getElementById("app");

m.route(appRoot, "/podcast", {
  "/podcast": PodcastViewer,
  "/error": ErrorHandler,
});
