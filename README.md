# devtools-svg

Proof of concept devtools extension that finds SVG symbols and images in the current page. Currently works only in Firefox but written as a [WebExtension](https://developer.mozilla.org/en-US/Add-ons/WebExtensions) so ultimately porting to Chrome should not be an issue.

## Goals

Provide a tool that lists SVG images in the inspected page, with a focus on inline SVG and icons.

I’m open to feature requests beyond this scope. What would be helpful for you? If you can explain why a feature would help in your development or design workflow, that would be great.

## Usage

Usage requires Firefox and some technical know-how.

1. Download a copy of this repository.
2. In Firefox, go to `about:debugging`, click “Load Temporary Add-on”, and select the `manifest.json` file.
3. Go to a page with SVG tags, open the devtools, and focus the "SVG" panel.

## To do

- [ ] Rewrite panel UI (probably using React)
- [ ] More features ^^
- [ ] Chrome compatibility
- [ ] Publish on Mozilla and Chrome extension sites

## Credits

Lion icon [by lastspart on The Noun Project](https://thenounproject.com/term/lion/699915/). I picked it because old material about SVG often used a color illustration of a big cat, which I remembered as a lion, but it turns out it was a tiger. Well, I like the lion. :P
