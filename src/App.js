import React, { Component } from 'react';
import { Provider} from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducers';
import undoable, { excludeAction } from 'redux-undo';
import { ActionCreators as UndoActionCreators } from 'redux-undo'

export function configureStore(initialState = { game: { entities: [], keys: {} } }) {
  const store = createStore(
    undoable(reducer, {
      limit: 240,
      filter: excludeAction(['KEY_DOWN', 'KEY_UP'])
    }),
    initialState,
    window.devToolsExtension && window.devToolsExtension()
  );
  return store;
}

const store = configureStore();

// Actions
const addEntity = (options) => ({
  type: 'ADD_ENTITY',
  options
});


function killEntity(options) {
  return {
    type: 'KILL_ENTITY',
    entityId: options.entityId
  }
}

const moveEntity = (entityId, delta) => ({
  type: 'MOVE_ENTITY',
  entityId,
  delta
});

const keyChange = (change, code) => {
  return {
    type: change === 'up' ? 'KEY_UP' : 'KEY_DOWN',
    key: String.fromCharCode(code).toLowerCase()
  };
}

const reflect = (entityId, delta) => ({
  type: 'FLIP_ENTITY_DIRECTION',
  entityId,
  delta
});

const setEntityPosition = (entityId, position) => ({
  type: 'SET_ENTITY_POSITION',
  entityId,
  position
});

const options = {
  canvas: {
    width: 800,
    height: 600
  },
  bounds: {
    x: { lower: 0, upper: 800 },
    y: { lower: 0, upper: 450 }
  }
};

export default class App extends Component {
  tick() {
    const state = store.getState().present.game;

    // document.querySelector('#debug').textContent = JSON.stringify(state);

    if (state.keys.e) {
      store.dispatch(UndoActionCreators.jump(-2));
      return;
    };

    for (let i = 0; i < state.entities.length; i++) {
      if (state.entities[i] !== null && typeof state.entities[i].tick === 'function') {
        state.entities[i].tick();
      }
    }

    const player = state.entities[0];

    if (state.keys.d) { store.dispatch(moveEntity(0, { x: 10, y: 0 })) }
    if (state.keys.a) { store.dispatch(moveEntity(0, { x: -10, y: 0 })) }

    if (player.position.x < options.bounds.x.lower ||
        player.position.x > options.bounds.x.upper - player.width) {
      let dX = 0;
      let dY = 0;

      if (player.position.x < options.bounds.x.lower) {
        dX = -player.position.x;
      } else if (player.position.x > options.bounds.x.upper - player.width) {
        dX = options.bounds.x.upper - player.position.x - player.width;
      }

      store.dispatch(moveEntity(0, { x: dX / 10, y: dY}))
    }
  }

  cameraShake = { x: 0, y: 0, reduction: 0.95 };

  draw(canvas, context, store, _delta) {
    const state = store.getState().present.game;

    if (store.getState().present.game.keys.e) {
      context.fillStyle = 'rgba(255, 255, 255, 0.01)'; // Trails
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    for (let i = 0; i < state.entities.length; i++) {
      const entity = state.entities[i];
      if (entity === null) continue;

      context.fillStyle = entity.color || '#000';
      context.fillRect(
        entity.position.x,
        entity.position.y,
        entity.width,
        entity.height
      );
    }

    window.requestAnimationFrame(this.draw.bind(this, canvas, context, store));
  }

  bindKeys() {
    window.addEventListener('keydown', (event) => {
      store.dispatch(keyChange('down', event.keyCode));
    });

    window.addEventListener('keyup', (event) => {
      store.dispatch(keyChange('up', event.keyCode));
    });
  }

  componentDidMount() {
    this.bindKeys();
    // Paddle, hardcoded
    store.dispatch(addEntity({
      position: { x: options.canvas.width / 2, y: 400 },
      width: 120
    }));

    // Ball, hardcoded
    store.dispatch(addEntity({
      position: { x: options.canvas.width / 2, y: 350 },
      direction: Math.PI / 4,
      speed: 5,
      color: 'rgba(255, 0, 0, 1)',
      tick: function() {
        const state = store.getState().present.game;
        const player = state.entities[0];

        if (this.intersectsWith(player) ||
            this.outOfBounds(0, options.canvas.width - 30, 0, options.canvas.height - 30)) {
          let delta = 0;
          if (state.keys.d) { delta = 2 * Math.PI }
          if (state.keys.a) { delta = Math.PI }

          store.dispatch(reflect(this.uid));
        }

        const dX = Math.cos(this.direction) * this.speed;
        const dY = Math.sin(this.direction) * this.speed;
        store.dispatch(moveEntity(this.uid, { x: dX, y: dY }));
      }
    }));

    // Blocks
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 6; j++) {
        const x = 155 + i * 44;
        const y = 50 + j * 22;
        store.dispatch(addEntity({
          position: { x, y },
          width: 40,
          color: `rgba(${x % 255}, ${y % 255}, ${(x + y) % 255}, 1)`,
          tick: function() {
            const ball = store.getState().present.game.entities[1];
            if (this.intersectsWith(ball)) {
              store.dispatch(killEntity({ entityId: this.uid }));
              store.dispatch(reflect(1)); // reflect ball
            }
          }
        }));
      }
    }

    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const tickrate = 60;

    window.setInterval(this.tick, 1000 / tickrate);
    window.requestAnimationFrame(this.draw.bind(this, canvas, context, store));
  }

  render() {
    return (
      <div>
        <canvas id="game-canvas" width={options.canvas.width} height={options.canvas.height} style={{ border: 'solid 1px blue'}}></canvas>
      </div>
    );
  }
}
