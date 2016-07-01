import React, { Component } from 'react';
import { Provider} from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducers';
import undoable, { excludeAction } from 'redux-undo';
import { ActionCreators as UndoActionCreators } from 'redux-undo'

export function configureStore(initialState = { game: { entities: [], keys: {} } }) {
  const store = createStore(undoable(reducer, { limit: 120, filter: excludeAction(['KEY_DOWN', 'KEY_UP']) }), initialState,
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

const addBall = (position) => ({
  type: 'ADD_BALL',
  position,
  direction: 0,
  speed: 10
});

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

const reflect = (entityId) => ({
  type: 'FLIP_ENTITY_DIRECTION',
  entityId
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

    if (state.keys.e) {
      store.dispatch(UndoActionCreators.jump(-2));
      return;
    };

    for (let i = 0; i < state.entities.length; i++) {
      if (typeof state.entities[i].tick === 'function') {
        state.entities[i].tick();
      }
    }

    const player = state.entities[0];

    if (state.keys.d) { store.dispatch(moveEntity(0, { x: 10, y: 0 })) }
    if (state.keys.a) { store.dispatch(moveEntity(0, { x: -10, y: 0 })) }
    // if (state.keys.w) { store.dispatch(moveEntity(0, { x: 0, y: -10 })) }
    // if (state.keys.s) { store.dispatch(moveEntity(0, { x: 0, y: 10 })) }

    if (player.position.x < options.bounds.x.lower ||
        player.position.x > options.bounds.x.upper) {
      let dX = 0;
      let dY = 0;

      if (player.position.x < options.bounds.x.lower) {
        dX = -player.position.x;
      } else if (player.position.x > options.bounds.x.upper) {
        dX = options.bounds.x.upper - player.position.x;
      }

      store.dispatch(moveEntity(0, { x: dX / 10, y: dY}))
    }
  }

  draw(canvas, context, store, _delta) {
    const state = store.getState().present.game;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < state.entities.length; i++) {
      const entity = state.entities[i];
      context.fillRect(
        entity.position.x - entity.width / 2,
        entity.position.y - entity.height / 2,
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
    store.dispatch(addEntity({
      position: { x: options.canvas.width / 2, y: 400 },
      width: 120
    }));

    store.dispatch(addEntity({
      position: { x: options.canvas.width / 2, y: 350 },
      direction: Math.PI / 4,
      speed: 1,
      tick: function() {
        const player = store.getState().present.game.entities[0];
        if (this.intersectsWith(player)) {
          store.dispatch(reflect(this.uid));
        }

        const dX = Math.cos(this.direction) * this.speed;
        const dY = Math.sin(this.direction) * this.speed;
        store.dispatch(moveEntity(this.uid, { x: dX, y: dY }));
      }
    }));

    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const tickrate = 60;

    window.setInterval(this.tick, 1000 / tickrate);
    window.requestAnimationFrame(this.draw.bind(this, canvas, context, store));
  }

  render() {
    return (
      <div>
        <canvas id="game-canvas" width={options.canvas.width} height={options.canvas.height}></canvas>
      </div>
    );
  }
}
