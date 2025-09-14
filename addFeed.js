import {
  getAllTags,
  getFeedWithURL,
  loadFeedFromURL,
  saveFeed,
} from "./common/dataStorage.js";

const feedNameInput = document.getElementById("feed_name");
const feedURLInput = document.getElementById("feed_url");
const fetchFrequency = document.getElementById("update_frequency");
const tagsInput = document.getElementById("tags");
const addFeedButton = document.getElementById("add_feed");
const feedValidationSpan = document.getElementById("validation");
const tagsSelector = document.getElementById("tags_selector");
const blogTypeDetectionRadios = document.querySelectorAll(
  `input[name="blog_type_detection"]`,
);

let blogTypeDetection = "auto";

const search = new URLSearchParams(location.search);

function displayBrokenFeedMessage(feed_url) {
  let url = `https://validator.w3.org/feed/check.cgi?url=${
    encodeURIComponent(feed_url)
  }`;
  feedValidationSpan.innerHTML =
    `Error: this feed can't be loaded. <a href="${url}" target="_blank">Click to check it on a validator</a>.`;
  addFeedButton.disabled = true;
}

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

      if (feed.blogTypeDetection) {
        for (const radioButton of blogTypeDetectionRadios) {
          if (feed.blogTypeDetection === radioButton.value) {
            radioButton.checked = true;
            break;
          }
        }
      } else {
        document.getElementById("blog_type_detection_auto").checked = true;
      }
    }
    console.log("Editing feed", feed);
  } else {
    /* New Feed, fetch title */

    try {
      feed = await loadFeedFromURL(url);
      console.log("New feed", feed);

      if (feed) {
        feedNameInput.value = feed.title;
      }
    } catch (e) {
      console.log("feed doesn't load");
      console.dir(e);
      displayBrokenFeedMessage(url);
    }
  }
}

getAllTags().then((tags) => {
  tags.forEach((t) => {
    let option = document.createElement("option");
    option.setAttribute("value", t);
    option.innerText = t;
    tagsSelector.appendChild(option);
  });
  tagsSelector.disabled = false;
});

tagsSelector.addEventListener("change", (evt) => {
  let tag = evt.target.value;

  let tags = [];
  if (tagsInput.value.trim().length > 0) {
    tags = tagsInput.value.split(",").map((s) => s.trim());
  }
  tags.push(tag);
  tagsInput.value = tags.join(", ");
});

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

  for (const radioButton of blogTypeDetectionRadios) {
    if (radioButton.checked) {
      feed.blogTypeDetection = radioButton.value;
      break;
    }
  }

  const onOk = (e) => {
    window.close();
  };

  const onError = (e) => {
    console.log("error", e);
  };

  saveFeed(feed).then(onOk, onError);
});

feedURLInput.addEventListener("change", async (evt) => {
  feedValidationSpan.innerText = "";
  let feed_url = evt.target.value;
  if (feed_url.length !== 0) {
    console.log("checking feed...");
    try {
      let tentative_feed = await loadFeedFromURL(feed_url);
      addFeedButton.disabled = false;
    } catch (e) {
      console.log("feed doesn't load");
      console.dir(e);
      displayBrokenFeedMessage(feed_url);
    }
  }
});
