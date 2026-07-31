# Our Little Adventure

A lightweight browser game template for a romantic gift. It has:

- A top-down 2D path you can walk with `WASD` or arrow keys
- Required interaction stops that open a love note popup
- Optional real-life photos for each memory stop
- A finale at the cliff with animated fireworks, including heart-shaped bursts

## Run it locally

Because this is a plain static site, you can open [index.html](C:\Users\centu\Documents\4 month gift\index.html) directly in a browser.

If you want a tiny local server instead, run this from the project folder:

```powershell
node preview-server.cjs
```

Then open `http://127.0.0.1:8765`.

## Customize the memories

Edit [script.js](C:\Users\centu\Documents\4 month gift\script.js).

Inside `GAME_CONFIG.stops`, each stop has:

- `title`: the popup title
- `note`: the love note text
- `image`: a file path such as `images/first-date.jpg`
- `x` and `y`: the tile where the interaction happens
- `gate`: the tile that stays locked until that memory is opened

Example:

```js
{
  id: "first-date",
  title: "Our First Date",
  note: "I still think about how happy I felt that day...",
  image: "images/first-date.jpg",
  x: 4,
  y: 9,
  gate: { x: 5, y: 9 }
}
```

## Add your photos

1. Create an `images` folder in the project root.
2. Drop your photos in that folder.
3. Point each stop's `image` field at the matching file.

## Adjust the map

Still in [script.js](C:\Users\centu\Documents\4 month gift\script.js), edit `TILE_ROWS`.

- `g` = grass
- `p` = path
- `w` = water
- `c` = cliff

## Publish on GitHub Pages

Once the repo is on GitHub, the easiest path is GitHub Pages:

1. Push the repository to GitHub.
2. In the repository settings, open **Pages**.
3. Set the source to deploy from the `main` branch.
4. After GitHub publishes it, share the Pages link with your girlfriend.

## Next nice upgrades

- Add custom sprite art for the player and memory spots
- Swap the popup for a dialogue box that types text out
- Add music
- Add a title screen and ending message with your names
