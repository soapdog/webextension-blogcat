BlogCat follows a strange set of rules. These rules are in place to keep development fun for me. I burned out with Web Development and have a dislike for the current state-of-art JS tooling. My dislike is not because there is anything wrong with it, it is bloody wonderful and JS will never cease to amaze me. Still, I don't like using the current crop of package managers, frameworks, and bundlers. I realised that forcing myself into that ecosystem would add friction to my joy of developing this extension to the point that I wouldn't actually work on it. Because of that, I decided to implement things like the old days. These are the rules:

- No package managers or build systems.
- Keep dependencies to a minimum, prefer reimplementation in a simple form over adding a new dependency. When possible reuse a browser feature instead of implementing our own.
- Write JS that the browser understands. Avoid transpilation.
- Keep transpiled dependencies in `vendor/`.
- Develop features in isolation when possible.

You're welcome to fix my bad JS, add new features, and fork the hell out of this project including to make it more in tune with what other developers expect. Just be aware that I won't accept contributions that break my own rules. Adding a `package.json` and a ton of stuff in `node_modules/` won't do, don't even try. Thank you for joining the fun train, I'll be your guide.

## Adding a ton of stuff

If you want to add a super complex feature that will require a major change to the project, please reach out to me to have a convo about it before you use your precious time. Your best path forward might be forking. BlogCat is a cat, I expect that once released into the wild, much like normal cats, it will fork into way too many cats.

## Version control

I'm treating git as a glorified videogame save state. I couldn't care less about an organised commit history and sensible branching. That doesn't mean that people doing JS as a job shouldn't care about it. I'm just saying, I personally don't care about it on this project.

The `main` branch is where development happens.

I promise to write better commit messages going forward. I developed this add-on in a flurry of giggles and coffee, I was working faster than common sense. Maintainability is still running trying to reach me and scream in my ears. Still, I can write very good commit messages and I'll stop bundling together unrelated things in the same commit.

Going forward releases on AMO will be tagged.

## How to reach me for contribution?

For this project, the easiest pathway is through [Github Issues](https://github.com/soapdog/webextension-blogcat/issues). If you don't want to use Github (understandable, originally I was using Fossil for this project), then reach out to me in one of [my socials](https://andregarzia.com/links).

## What is the best way to contribute?

The best way to contribute is to use the add-on and give me feedback. Feedback and ideas are more important than code contributions, I'd rather you tell me the feature you want and I go there and implement it in a way that matches the ethos of BlogCat.

The second best way to contribute is by [buying me a coffee](https://ko-fi.com/andreshouldbewriting). Free and open source software have a sustainability problem (gonna blog about this at some point). Projects that help companies doing large scale server-side stuff get lots of funding and hands on it, but small end user apps don't. Most developers working on FOSS desktop apps and add-ons are having their bills paid by another job. Basically funneling their own time and money from elsewhere into these little passion projects. I'd love to put more hours into BlogCat, but I only have a small amount of hours I can dedicate to it every week before it eats up into the hours I must use for my contracting works. If BlogCat gets donations, I can then put more hours into it without struggling to make the ends meet.

The time a self-employed developer puts into a FOSS project is a very precious thing. You can help me have more time for this kind of thing.
