const player = document.getElementById("youtube-player");
const search = new URLSearchParams(location.search);

if (search.has("id")) {
  let id = search.get("id");
  let url = `https://www.youtube.com/embed/${id}`;
  player.src = url;
}
