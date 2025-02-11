import { saveFeed, loadFeedFromURL } from "./common/dataStorage.js"

const feedNameInput = document.getElementById("feed_name")
const feedURLInput = document.getElementById("feed_url")
const fetchFrequency = document.getElementById("update_frequency")
const addFeedButton = document.getElementById("add_feed")
const search = new URLSearchParams(location.search)

if (search.has("url")) {
    let url = search.get("url")
    feedURLInput.value = url

    let feed = await loadFeedFromURL(url)

    if (feed) {
        feedNameInput.value = feed.title
    }
}

addFeedButton.addEventListener("click", evt => {
    evt.stopPropagation()
    evt.preventDefault()

    addFeedButton.disabled = true 

    let feed = {
        title: feedNameInput.value,
        url: feedURLInput.value,
        frequency: update_frequency.value
    }

    const onOk = e => {
        location = "reader.html"
    }

    const onError = e => {
        console.log("error", e)
    }

    saveFeed(feed).then(onOk, onError)
})