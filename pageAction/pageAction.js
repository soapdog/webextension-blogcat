function copyToClipboard(str) {
  console.log("copying", str);
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(str);
  }

  return Promise.reject("The Clipboard API is not available.");
}

function handleResponse(res) {
  console.log("got response", res);

  if (!res) {
    return;
  }

  if (res.atom || res.rss || res.blogroll) {
    document.getElementById("feed-section").classList.remove("hide");
  }

  if (res.linkgraph) {
    document.getElementById("linked-posts").classList.remove("hide");
  }

  if (res.atom) {
    document
      .getElementById("atom_link")
      .setAttribute("href", `../addFeed.html?url=${res.atom}`);
    document.getElementById("atom_copy").addEventListener("click", (ev) => {
      copyToClipboard(res.atom);
    });
    document.getElementById("subscribe_atom").style.display = "block";
    document.getElementById("copy_atom").style.display = "block";

    document
      .getElementById("subscribe_atom")
      .addEventListener("click", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        browser.tabs.create({
          url: `../addFeed.html?url=${res.atom}`,
        });
      });
  }

  if (res.rss) {
    document
      .getElementById("rss_link")
      .setAttribute("href", `../addFeed.html?url=${res.rss}`);
    document.getElementById("rss_copy").addEventListener("click", (ev) => {
      copyToClipboard(res.rss);
    });
    document.getElementById("subscribe_rss").style.display = "block";
    document.getElementById("copy_rss").style.display = "block";

    document.getElementById("subscribe_rss").addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      browser.tabs.create({
        url: `../addFeed.html?url=${res.rss}`,
      });
    });

    if (res.rss.startsWith("https://www.youtube.com/feeds/videos.xml")) {
      document.getElementById("youtube_loading").style.display = "none";
    }
  }

  if (res.blogroll) {
    document
      .getElementById("blogroll_link")
      .setAttribute("href", `../importOpml.html?url=${res.blogroll}`);
    document.getElementById("blogroll_copy").addEventListener("click", (ev) => {
      copyToClipboard(res.blogroll);
    });
    document.getElementById("open_blogroll").style.display = "block";
    document.getElementById("copy_blogroll").style.display = "block";

    document.getElementById("open_blogroll").addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      browser.tabs.create({
        url: `../importOpml.html?url=${res.blogroll}`,
      });
    });
  }
  if (res.linkgraph) {
    const ul = document.getElementById("linkgraph");
    console.log(res.linkgraph);
    for (link of res.linkgraph) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = link;
      a.innerText = link;
      li.appendChild(a);
      ul.appendChild(li);
    }
  }
}

function getCurrentActiveTab(tabs) {
  console.log("got tabs", tabs);

  let tab = tabs[0];

  if (tab.url.startsWith("https://youtube.com")) {
    document.getElementById("youtube_loading").style.display = "block";
  }

  const sending = browser.runtime.sendMessage({
    tab,
  });

  sending.then(handleResponse, onError);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

var querying = browser.tabs.query({ currentWindow: true, active: true });
querying.then(getCurrentActiveTab, onError);
