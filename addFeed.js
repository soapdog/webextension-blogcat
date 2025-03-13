import {
  saveFeed,
  loadFeedFromURL,
  getFeedWithURL,
} from "./common/dataStorage.js";

const feedNameInput = document.getElementById("feed_name");
const feedURLInput = document.getElementById("feed_url");
const fetchFrequency = document.getElementById("update_frequency");
const tagsInput = document.getElementById("tags");
const addFeedButton = document.getElementById("add_feed");
const search = new URLSearchParams(location.search);

if (search.has("url")) {
  let url = search.get("url");
  feedURLInput.value = url;

  let feed;

  /* Check if we're already following feed */
  feed = await getFeedWithURL(url);

  if (feed.title) {
    feedNameInput.value = feed.title;
    fetchFrequency.value = feed.frequency;

    if (feed?.tags) {
      feed.tags = feed.tags.filter((t) => t !== "");

      let tags = feed.tags ? feed.tags.join(", ") : "";

      tagsInput.value = tags;
    }
    console.log("Editing feed", feed);
  } else {
    /* New Feed, fetch title */

    feed = await loadFeedFromURL(url);
    console.log("New feed", feed);

    if (feed) {
      feedNameInput.value = feed.title;
    }
  }
}

addFeedButton.addEventListener("click", (evt) => {
  evt.stopPropagation();
  evt.preventDefault();

  addFeedButton.disabled = true;

  let feed = {
    title: feedNameInput.value,
    url: feedURLInput.value,
    frequency: update_frequency.value,
  };

  if (tagsInput.value.trim().length > 0) {
    feed.tags = tagsInput.value.split(",").map((s) => s.trim());
  }

  const onOk = (e) => {
    location = "reader.html";
  };

  const onError = (e) => {
    console.log("error", e);
  };

  saveFeed(feed).then(onOk, onError);
});
