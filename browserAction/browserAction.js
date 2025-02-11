function goReader() {
  browser.tabs.create({
    url: "/reader.html",
  })
  window.close()
}

function goAddFeed() {
  browser.tabs.create({
    url: "/addFeed.html",
  })
  window.close()
}

function goImportOpml() {
  browser.tabs.create({
    url: "/importOpml.html",
  })
  window.close()
}

function goSettings() {
  browser.runtime.openOptionsPage()
  window.close()
}

function goHelp() {
  const url = browser.extension.getURL("docs/index.html")
  browser.tabs.create({
    url: `${url}#/?id=readme`,
  })
  window.close()
}

function goReleaseNotes() {
  const version = browser.runtime.getManifest().version
  const url = browser.extension.getURL(
    `/docs/index.html#/release_notes/${version}`
  )
  browser.tabs.create({
    url: `${url}#/?id=readme`,
  })
  window.close()
}

document.getElementById("options-trigger").addEventListener("click", (ev) => {
  ev.stopPropagation()
  ev.preventDefault()
  goSettings()
})

document.getElementById("go-to-reader").addEventListener("click", (ev) => {
  ev.stopPropagation()
  ev.preventDefault()
  goReader()
})

document.getElementById("go-to-add-feed").addEventListener("click", (ev) => {
  ev.stopPropagation()
  ev.preventDefault()
  goAddFeed()
})

document.getElementById("go-to-import-opml").addEventListener("click", (ev) => {
  ev.stopPropagation()
  ev.preventDefault()
  goImportOpml()
})

document.getElementById("go-to-help").addEventListener("click", (ev) => {
  ev.stopPropagation()
  ev.preventDefault()
  goHelp()
})

document
  .getElementById("go-to-release-notes")
  .addEventListener("click", (ev) => {
    ev.stopPropagation()
    ev.preventDefault()
    goReleaseNotes()
  })

const version = browser.runtime.getManifest().version
document.getElementById("blogcat-header").innerText = `BlogCat ${version}`
