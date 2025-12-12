# Spot it!

A web-based implementation of the Spot it! / Dobble card game, built with Next.js.

## Features

- **Spot It Game Mode**: Practice finding matching symbols between cards
- **Visualizer Mode**: Explore and understand the mathematical structure of the deck
- **Multiple Deck Sizes**: From 7 cards (order 2) to 133 cards (order 11)
- **Hard Mode**: Scattered symbols with varied sizes for an extra challenge
- **OpenMoji Support**: Consistent, beautiful emojis across all platforms

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## How Spot it! Works

Spot it! uses projective plane geometry to ensure that any two cards share exactly one symbol. For a deck of order `q`:
- Total cards = q² + q + 1
- Total symbols = q² + q + 1
- Symbols per card = q + 1

## Credits

### OpenMoji

Emojis designed by [OpenMoji](https://github.com/hfg-gmuend/openmoji) – the open-source emoji and icon project. License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## License

MIT
