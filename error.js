const search = new URLSearchParams(location.search);

let error = JSON.parse(search.get("error"));
let url = search.get("url");

console.log(error);

let title = `BlogCat Error`;

let body = `
An error happened in file **${error.source}**.

${JSON.stringify(error)}

Please describe what happened below. If possible, include screenshots.
----
`;

let filename = error.source.split("/").slice(3).join("/");

const ErrorHandler = {
    view: (vnode) => {
        return [
            m("h1", "An Error Has Errored"),
            m("blockquote", m("code", error.message)),
            m("p", m.trust(`The error happened in <code>${filename}</code>`)),
            m("p", m.trust(`Possible actions:`)),
            m("ul", [
                m(
                    "li",
                    m("a", {
                        href:
                            `https://github.com/soapdog/blogcat/issues/new?title=${
                                encodeURIComponent(title)
                            }&body=${encodeURIComponent(body)}`,
                    }, "Report bug so I can fix it"),
                ),
                m(
                    "li",
                    m("a", {
                        href: `/addFeed.html?url=${encodeURIComponent(url)}`,
                    }, "Edit the feed configuration"),
                ),
            ]),
        ];
    },
};

const appRoot = document.getElementById("app");

m.route(appRoot, "/error", {
    "/error": ErrorHandler,
});
