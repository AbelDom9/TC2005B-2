# Breakout

A Breakout game made in JavaScript for my videogames class. The game has a space theme with a galaxy background and a spaceship as the paddle.

## How to run

Just open the index.html file in your browser, no installation needed.

## Controls

- Arrow keys or A/D to move the spaceship
- Space to launch the ball
- R to restart after game over

## How to play

Destroy all the blocks by bouncing the ball with your spaceship. You have 3 lives, if the ball falls to the bottom you lose one. There are 3 levels, each one adds a row of blocks. Clear all 3 levels to win.

## Power-ups

Sometimes when you destroy a block a power-up will fall down. Catch it with your spaceship to activate it. There are 3 types: W makes your ship wider, M spawns an extra ball, and S slows the ball down.

## Project structure

```
Videojuegos/Breakout/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── 11_Breakout.js
│   └── libs/
│       ├── game_functions.js
│       ├── GameObject.js
│       ├── Vector.js
│       ├── Rect.js
│       └── TextLabel.js
└── assets/
    └── audio/
        └── laser.wav
```

## Author

Jose Abel Dominguez Rish
