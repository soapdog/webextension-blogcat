import { FeedLoader, deleteFeed, getAllSettings, saveSettings } from "/common/dataStorage.js"


const makeInput = (key, label) => {
    return m("div", [
        m("label", { for: key }, label),
        m("input[type=text]", {
            name: key,
            value: settings[key],
            oninput: e => {
                settings[key] = e.target.value
                saveSettings(settings)
            }
        })
    ])
}

const makeRadio = (key, label, options) => {
    let keys = Object.keys(options)
    return m("fieldset", [
        m("legend", label),
        keys.map(v => {
            let l = options[v]
            return m("div", [
                m("input[type=radio]", {
                    name: key,
                    value: v,
                    checked: settings[key] == v,
                    oninput: e => {
                        settings[key] = e.target.value
                        saveSettings(settings)
                    }
                }),
                m("label", {for: key}, l)
            ])
        })
    ])
}

const SettingsManager = {
    view: vnode => {
        console.log(settings)
        return m("form", [
            makeInput("postsPerBlog", "Show How Many Posts Per Blog?"),
            makeRadio("openPostsIn", "Where To Open A Blog Post?", {
                "newtab": "Posts open in a new tab",
                "sametab": "Posts open on the same tab"
            }),
            makeRadio("postViewer", "How To Open A Blog Post?", {
                "reader": "Posts open using reader view",
                "web": "Posts open on their own page"
            }),
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