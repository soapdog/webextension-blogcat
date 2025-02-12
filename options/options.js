import { FeedLoader, deleteFeed, getAllSettings, saveSettings } from "/common/dataStorage.js"

const SettingsManager = {
    view: vnode => {
        console.log(settings)
        return m("form", [
            m("label", {for: "how-many-posts"}, "How many posts to show per blog"),
            m("input[type=text]", {name: "how-many-posts", value: settings.postsPerBlog})
        ])
    }
}

const SubscriptionsManager = {
    view: vnode => {
        return m("section", "feeds")
    }
}

const Options = {
    view: vnode => {
        return [
            m(SettingsManager),
            m(SubscriptionsManager)
        ]
    }
}


let settings = await getAllSettings()

const appRoot = document.getElementById("app")
let feeds = []

m.route(appRoot, "/options", {
    "/options": Options
})