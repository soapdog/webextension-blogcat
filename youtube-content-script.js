console.log("Adding popstate event listener");
window.addEventListener("yt-navigate-finish", async (event) => {
  console.log(
    `location: ${document.location}, state: ${JSON.stringify(event.state)}`,
  );

  const res = await fetch(document.location);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  const id = doc
    .querySelector('meta[property="og:url"]')
    .getAttribute("content")
    .split("/")
    .at(4);

  console.log("channel id", id);
});
console.log("after adding");
