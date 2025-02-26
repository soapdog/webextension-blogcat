function copyToClipboard(str) {
  console.log("copying", str);
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(str);
  }

  return Promise.reject("The Clipboard API is not available.");
}

function getCurrentActiveTab(tabs) {
  console.log("got tabs", tabs);

  function handleResponse(res) {
    console.log("got response", res);

    if (!res) {
      return;
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
    }

    if (res.blogroll) {
      document
        .getElementById("blogroll_link")
        .setAttribute("href", `../importOpml.html?url=${res.blogroll}`);
      document
        .getElementById("blogroll_copy")
        .addEventListener("click", (ev) => {
          copyToClipboard(res.blogroll);
        });
      document.getElementById("open_blogroll").style.display = "block";
      document.getElementById("copy_blogroll").style.display = "block";
    }
  }

  let tab = tabs[0];

  const sending = browser.runtime.sendMessage({
    tab: tab.id,
  });

  sending.then(handleResponse, onError);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

var querying = browser.tabs.query({ currentWindow: true, active: true });
querying.then(getCurrentActiveTab, onError);
