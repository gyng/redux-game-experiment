import React, { Component } from 'react';
import { Provider} from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import reducer from './reducers';

export function configureStore(initialState = { game: { entities: [] } }) {
  const store = createStore(reducer, initialState,
    window.devToolsExtension && window.devToolsExtension()
  );
  return store;
}

const store = configureStore();

// Actions
const addEntity = (position) => {
  return {
    type: 'ADD_ENTITY',
    position
  };
};

export default class App extends Component {
  tick() {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const state = store.getState().game;

    for (let i = 0; i < state.entities.length; i++) {
      const entity = state.entities[i];
      context.fillRect(
        entity.position.x - entity.radius,
        entity.position.y - entity.radius,
        entity.position.x + entity.radius,
        entity.position.y + entity.radius
      );
    }

    window.requestAnimationFrame(this.tick.bind(this));
  }

  componentDidMount() {
    store.dispatch(addEntity({ x: 10, y: 10 }));
    window.requestAnimationFrame(this.tick.bind(this));
  }

  render() {
    return (
      <div>
        {store.getState().game.entities.length}
        <canvas id="game-canvas" width={800} height={450}></canvas>
      </div>
    );
  }
}
